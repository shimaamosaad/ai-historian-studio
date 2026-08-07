import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  searchDocument,
  type DocumentSearchResult,
} from "@/lib/ai/searchDocument";
import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/lib/openai/client";

export const runtime = "nodejs";
export const maxDuration = 300;

type ProjectEvidence = {
  documentId: number;
  documentName: string;
  text: string;
  page: number | null;
  score: number;
};

type ModelAnswer = {
  answer?: string;
  confidence?: number;
};

const MAX_RESULTS_PER_DOCUMENT = 8;
const MAX_PROJECT_EVIDENCE = 24;
const MAX_EVIDENCE_CHARACTERS = 2200;

function cleanText(
  value: string,
  maxLength = MAX_EVIDENCE_CHARACTERS
): string {
  const clean = value
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength).trim()}...`;
}

function removeDuplicateEvidence(
  evidence: ProjectEvidence[]
): ProjectEvidence[] {
  const seen = new Set<string>();

  return evidence.filter((item) => {
    const key = item.text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500)
      .toLocaleLowerCase("ar");

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function diversifyEvidence(
  evidence: ProjectEvidence[]
): ProjectEvidence[] {
  const sorted = [...evidence].sort(
    (a, b) => b.score - a.score
  );

  const selected: ProjectEvidence[] = [];
  const perDocument = new Map<number, number>();

  // الجولة الأولى: نضمن تمثيل أكبر عدد ممكن من المستندات.
  for (const item of sorted) {
    if (selected.length >= MAX_PROJECT_EVIDENCE) {
      break;
    }

    const current =
      perDocument.get(item.documentId) ?? 0;

    if (current >= 2) {
      continue;
    }

    selected.push(item);
    perDocument.set(
      item.documentId,
      current + 1
    );
  }

  // الجولة الثانية: نملأ الأماكن المتبقية بأقوى الأدلة.
  if (selected.length < MAX_PROJECT_EVIDENCE) {
    const selectedKeys = new Set(
      selected.map(
        (item) =>
          `${item.documentId}:${item.page ?? "x"}:${item.text.slice(0, 180)}`
      )
    );

    for (const item of sorted) {
      if (selected.length >= MAX_PROJECT_EVIDENCE) {
        break;
      }

      const key =
        `${item.documentId}:${item.page ?? "x"}:${item.text.slice(0, 180)}`;

      if (selectedKeys.has(key)) {
        continue;
      }

      selected.push(item);
      selectedKeys.add(key);
    }
  }

  return selected;
}

function buildEvidenceText(
  evidence: ProjectEvidence[]
): string {
  return evidence
    .map((item, index) => {
      const pageLabel =
        item.page !== null
          ? `الصفحة ${item.page}`
          : "صفحة غير محددة";

      return [
        `الدليل ${index + 1}`,
        `المستند: ${item.documentName}`,
        `الموضع: ${pageLabel}`,
        cleanText(item.text),
      ].join("\n");
    })
    .join("\n\n--------------------\n\n");
}

function extractResponseText(
  response: any
): string {
  if (
    typeof response?.output_text === "string" &&
    response.output_text.trim()
  ) {
    return response.output_text.trim();
  }

  const output = Array.isArray(response?.output)
    ? response.output
    : [];

  for (const item of output) {
    const content = Array.isArray(item?.content)
      ? item.content
      : [];

    for (const part of content) {
      if (
        typeof part?.text === "string" &&
        part.text.trim()
      ) {
        return part.text.trim();
      }
    }
  }

  return "";
}

function cleanModelAnswer(
  value: string
): string {
  let answer = value.trim();

  // لو النموذج أعاد JSON كنص، نستخرج answer فقط.
  try {
    const parsed = JSON.parse(answer) as ModelAnswer;

    if (
      parsed &&
      typeof parsed.answer === "string"
    ) {
      answer = parsed.answer.trim();
    }
  } catch {
    // الرد نص عادي، لا مشكلة.
  }

  // حماية إضافية من ظهور أسماء حقول تقنية.
  return answer
    .replace(
      /\b(evidenceIndex|cleanedText|evidenceIndexes|JSON|Array|Object)\b\s*:?\s*/gi,
      ""
    )
    .trim();
}

function calculateConfidence(
  evidence: ProjectEvidence[]
): number {
  if (evidence.length === 0) {
    return 0;
  }

  const documentCount = new Set(
    evidence.map((item) => item.documentId)
  ).size;

  const pageCount = new Set(
    evidence
      .filter((item) => item.page !== null)
      .map(
        (item) =>
          `${item.documentId}:${item.page}`
      )
  ).size;

  const topScore = Math.max(
    ...evidence.map((item) => item.score),
    1
  );

  return Math.min(
    98,
    Math.max(
      35,
      Math.round(
        Math.min(topScore, 100) * 0.45 +
          Math.min(evidence.length * 2.2, 24) +
          Math.min(documentCount * 7, 21) +
          Math.min(pageCount * 1.2, 12)
      )
    )
  );
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    const projectId = Number(id);

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error: "رقم المشروع غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();
    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return NextResponse.json(
        {
          error: "اكتب سؤالًا صالحًا عن المشروع.",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },

        select: {
          id: true,
          title: true,

          documents: {
            where: {
              processingStatus: "COMPLETED",
            },

            orderBy: {
              createdAt: "asc",
            },

            select: {
              id: true,
              name: true,
              content: true,
              processedPages: true,
              totalPages: true,
            },
          },
        },
      });

    if (!project) {
      return NextResponse.json(
        {
          error:
            "المشروع غير موجود أو لا تملك صلاحية الوصول إليه.",
        },
        {
          status: 404,
        }
      );
    }

    const searchableDocuments =
      project.documents.filter(
        (document) =>
          Boolean(document.content?.trim())
      );

    if (searchableDocuments.length === 0) {
      return NextResponse.json(
        {
          error:
            "لا توجد مستندات مكتملة وقابلة للبحث داخل هذا المشروع.",
        },
        {
          status: 400,
        }
      );
    }

    const allEvidence: ProjectEvidence[] = [];

    for (const document of searchableDocuments) {
      const results: DocumentSearchResult[] =
        searchDocument(
          document.content ?? "",
          question,
          {
            maxResults:
              MAX_RESULTS_PER_DOCUMENT,
            maxResultsPerPage: 2,
          }
        );

      for (const result of results) {
        allEvidence.push({
          documentId: document.id,
          documentName:
            document.name ||
            `مستند رقم ${document.id}`,
          text: result.text,
          page: result.page,
          score: result.score,
        });
      }
    }

    const evidence = diversifyEvidence(
      removeDuplicateEvidence(allEvidence)
    );

    if (evidence.length === 0) {
      return NextResponse.json({
        answer:
          "لم يتم العثور على أدلة واضحة مرتبطة بالسؤال داخل مستندات المشروع.",
        evidence: [],
        confidence: 0,
        documentCount:
          searchableDocuments.length,
        sourceDocumentCount: 0,
      });
    }

    const evidenceText =
      buildEvidenceText(evidence);

    const client = getOpenAIClient();
    const model = getOpenAIModel();

    const response =
      await client.responses.create({
        model,
        store: false,
        max_output_tokens: 7000,

        reasoning: {
          effort: "low",
        },

        instructions: `
أنت مساعد بحث أكاديمي متخصص في التاريخ والعلوم الإنسانية.

المطلوب أن تجيب عن سؤال الباحث بالاعتماد على الأدلة المستخرجة من جميع مستندات المشروع، لا من مستند واحد فقط.

قواعد إلزامية:

1. اكتب بالعربية الفصحى الواضحة وبأسلوب أكاديمي رصين يشبه أسلوب الدراسات التاريخية والرسائل العلمية.
2. احتفظ بالاستفاضة. لا تختصر الإجابة اختصارًا مخلًا. إذا كانت الأدلة تسمح بتحليل طويل فاكتب تحليلًا طويلًا ومفصلًا.
3. نظّم الإجابة بعناوين فرعية مناسبة لطبيعة السؤال، مثل:
   - تمهيد أو خلفية تاريخية
   - تطور الأحداث
   - الشخصيات والقوى الفاعلة
   - الأسباب والدوافع
   - النتائج والآثار
   - قراءة تحليلية
   - استنتاج
   لا تُجبر كل هذه العناوين إن لم تكن مناسبة للسؤال.
4. اجمع المعلومات المتفرقة بين المستندات وقارن بينها عندما يفيد ذلك.
5. إذا اتفقت عدة مستندات على فكرة، بيّن أن الأدلة تتضافر عليها.
6. إذا ظهر اختلاف أو تعارض بين المستندات، اذكره بوضوح ولا تحاول إخفاءه.
7. لا تنسب إلى المصادر معلومة لا تدعمها الأدلة المرفقة.
8. يجوز لك الاستنتاج والتحليل، لكن ميّز الاستنتاج عن المعلومة الصريحة في المصادر.
9. لا تكتب أي أسماء حقول تقنية أو برمجية إطلاقًا، ومنها:
   evidenceIndex
   evidenceIndexes
   cleanedText
   JSON
   Array
   Object
10. لا تعرض البيانات في صورة JSON ولا تشرح آلية عمل النظام.
11. لا تنسخ الأدلة حرفيًا داخل الإجابة إلا عند الحاجة إلى اقتباس قصير.
12. لا تضع قائمة الأدلة الخام داخل نص الإجابة؛ الواجهة ستعرض الأدلة والمصادر أسفل الإجابة بصورة مستقلة.
13. يمكنك الإشارة طبيعيًا إلى المصدر داخل التحليل عند الحاجة بعبارات مثل:
    "وتشير إحدى وثائق المشروع..."
    أو
    "وتتفق عدة مصادر داخل المشروع..."
14. إذا كانت الأدلة غير كافية للإجابة عن جانب ما، صرّح بذلك بوضوح.
15. اختم باستنتاج أكاديمي عندما يكون السؤال تحليليًا.
        `.trim(),

        input: [
          `اسم المشروع: ${project.title}`,
          "",
          `سؤال الباحث: ${question}`,
          "",
          "الأدلة المستخرجة من مستندات المشروع:",
          "",
          evidenceText,
        ].join("\n"),
      });

    const rawAnswer =
      extractResponseText(response);

    const answer =
      cleanModelAnswer(rawAnswer);

    if (!answer) {
      throw new Error(
        "لم يتمكن الذكاء الاصطناعي من إنشاء إجابة صالحة."
      );
    }

    const sourceDocumentCount =
      new Set(
        evidence.map(
          (item) => item.documentId
        )
      ).size;

    return NextResponse.json({
      answer,

      evidence: evidence.map(
        (item) => ({
          documentId:
            item.documentId,

          documentName:
            item.documentName,

          page: item.page,

          text: cleanText(
            item.text,
            1200
          ),

          score: item.score,
        })
      ),

      confidence:
        calculateConfidence(
          evidence
        ),

      documentCount:
        searchableDocuments.length,

      sourceDocumentCount,
    });
  } catch (error) {
    console.error(
      "PROJECT ASK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء البحث داخل المشروع.",
      },
      {
        status: 500,
      }
    );
  }
}