import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/lib/openai/client";

import type {
  DocumentQuestionMode,
  DocumentSearchResult,
} from "@/lib/ai/searchDocument";

export type DocumentAnswerEvidence = {
  text: string;
  page: number | null;
};

export type GeneratedDocumentAnswer = {
  answer: string;
  quote: string;
  page: number | null;
  pages: number[];
  evidence: DocumentAnswerEvidence[];
  confidence: number;
  evidenceCount: number;
  mode: DocumentQuestionMode;
};

type ModelEvidence = {
  evidenceIndex: number;
  cleanedText: string;
};

type ModelAnswer = {
  answer: string;
  evidence: ModelEvidence[];
  confidence: number;
};

type SelectedEvidenceItem = {
  source: DocumentSearchResult;
  cleanedText: string;
};

const DOCUMENT_ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    answer: {
      type: "string",
      description:
        "إجابة عربية أكاديمية واضحة، تفصل بين ما ورد في الوثيقة والإثراء السياقي من معرفة النموذج.",
    },

    evidence: {
      type: "array",
      description:
        "الأدلة التي دعمت الإجابة مع تنقيح النص آليًا ليصبح واضحًا وسليمًا دون إضافة معلومات جديدة.",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          evidenceIndex: {
            type: "integer",
            minimum: 1,
            description:
              "رقم الدليل الأصلي من الأدلة المرسلة.",
          },

          cleanedText: {
            type: "string",
            description:
              "صياغة عربية منقحة للدليل، تصلح أخطاء الاستخراج فقط دون تغيير المعنى أو إضافة معلومات.",
          },
        },

        required: [
          "evidenceIndex",
          "cleanedText",
        ],
      },
    },

    confidence: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "درجة الثقة في مدى دعم الوثيقة للإجابة.",
    },
  },

  required: [
    "answer",
    "evidence",
    "confidence",
  ],
} as const;

function cleanText(
  value: string,
  maxLength: number
): string {
  const clean = value
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  const shortened = clean.slice(
    0,
    maxLength
  );

  const finalSeparator = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf("،"),
    shortened.lastIndexOf("؛"),
    shortened.lastIndexOf("؟"),
    shortened.lastIndexOf(" ")
  );

  if (
    finalSeparator >=
    maxLength * 0.7
  ) {
    return `${shortened
      .slice(
        0,
        finalSeparator + 1
      )
      .trim()}...`;
  }

  return `${shortened.trim()}...`;
}

function buildEvidenceText(
  results: DocumentSearchResult[]
): string {
  return results
    .map((result, index) => {
      const pageLabel =
        result.page !== null
          ? `الصفحة ${result.page}`
          : "صفحة غير محددة";

      return [
        `[[EVIDENCE:${index + 1}]]`,
        `المصدر: ${pageLabel}`,
        cleanText(
          result.text,
          2200
        ),
      ].join("\n");
    })
    .join("\n\n");
}

function validateModelEvidence(
  value: unknown,
  evidenceCount: number
): ModelEvidence[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const evidence: ModelEvidence[] =
    [];

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const candidate =
      item as Partial<ModelEvidence>;

    const evidenceIndex =
      typeof candidate.evidenceIndex ===
        "number" &&
      Number.isInteger(
        candidate.evidenceIndex
      )
        ? candidate.evidenceIndex
        : 0;

    const cleanedText =
      typeof candidate.cleanedText ===
      "string"
        ? candidate.cleanedText
            .replace(/\s+/g, " ")
            .trim()
        : "";

    if (
      evidenceIndex < 1 ||
      evidenceIndex >
        evidenceCount ||
      !cleanedText
    ) {
      continue;
    }

    evidence.push({
      evidenceIndex,
      cleanedText,
    });
  }

  const seen = new Set<number>();

  return evidence.filter((item) => {
    if (
      seen.has(item.evidenceIndex)
    ) {
      return false;
    }

    seen.add(item.evidenceIndex);

    return true;
  });
}

function validateModelAnswer(
  value: unknown,
  evidenceCount: number
): ModelAnswer {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "أعاد OpenAI نتيجة غير صالحة لسؤال المستند."
    );
  }

  const result =
    value as Partial<ModelAnswer>;

  const answer =
    typeof result.answer === "string"
      ? result.answer.trim()
      : "";

  if (!answer) {
    throw new Error(
      "لم يتمكن OpenAI من إنشاء إجابة صالحة."
    );
  }

  const confidence =
    typeof result.confidence ===
    "number"
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              result.confidence
            )
          )
        )
      : 0;

  return {
    answer,

    evidence:
      validateModelEvidence(
        result.evidence,
        evidenceCount
      ),

    confidence,
  };
}

function removeDuplicateEvidence(
  results: DocumentSearchResult[]
): DocumentSearchResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = result.text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500)
      .toLowerCase();

    if (
      !key ||
      seen.has(key)
    ) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

function getFriendlyOpenAIError(
  error: unknown
): Error {
  const possibleError = error as {
    status?: number;
    code?: string;
    message?: string;
  };

  if (
    possibleError.status === 401
  ) {
    return new Error(
      "مفتاح OpenAI غير صحيح أو غير مفعل."
    );
  }

  if (
    possibleError.status === 429 ||
    possibleError.code ===
      "insufficient_quota"
  ) {
    return new Error(
      "تعذر إنشاء الإجابة بسبب حد الاستخدام أو الرصيد في OpenAI."
    );
  }

  return new Error(
    possibleError.message ||
      "حدث خطأ أثناء إنشاء إجابة المستند."
  );
}


function cleanFinalAnswer(
  value: string
): string {
  return value
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(
      /["']?evidenceIndex["']?\s*:\s*\d+\s*,?/gi,
      ""
    )
    .replace(
      /["']?cleanedText["']?\s*:\s*/gi,
      ""
    )
    .replace(
      /\bevidenceIndex\s*:\s*\d+\s*-?/gi,
      ""
    )
    .replace(
      /\bcleanedText\s*:\s*/gi,
      ""
    )
    .replace(/^\s*["'{[]+\s*/gm, "")
    .replace(/\s*["'}\]]+\s*,?\s*$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateDocumentAnswer(
  question: string,
  results: DocumentSearchResult[],
  mode: DocumentQuestionMode
): Promise<GeneratedDocumentAnswer> {
  if (!question.trim()) {
    throw new Error(
      "لا يوجد سؤال صالح للإجابة."
    );
  }

  if (results.length === 0) {
    return {
      answer:
        "لم يتم العثور على معلومات واضحة مرتبطة بالسؤال داخل المستند.",

      quote: "",

      page: null,

      pages: [],

      evidence: [],

      confidence: 0,

      evidenceCount: 0,

      mode,
    };
  }

  /*
   * نرسل أفضل المقاطع فقط إلى OpenAI.
   * هذا يقلل التكلفة ويرفع جودة الإجابة.
   */
  const selectedResults =
    removeDuplicateEvidence(
      results
    ).slice(0, 12);

  const evidenceText =
    buildEvidenceText(
      selectedResults
    );

  const client =
    getOpenAIClient();

  const model =
    getOpenAIModel();

  try {
    const response =
      await client.responses.create({
        model,

        store: false,

        max_output_tokens: 6000,

        reasoning: {
          effort: "low",
        },

        instructions: `
أنت مساعد بحث أكاديمي متخصص في تحليل الوثائق التاريخية العربية.

مهمتك الإجابة عن سؤال الباحث بالاعتماد أولًا على الأدلة المرفقة من الوثيقة.

قواعد إلزامية:

1. اقرأ السؤال وجميع الأدلة قبل الإجابة.
2. اعتمد في قسم "الإجابة من الوثيقة" فقط على الأدلة المرفقة.
3. لا تنسب إلى الوثيقة معلومة غير موجودة في الأدلة.
4. اجمع المعلومات المتفرقة من أكثر من صفحة عندما تكون مرتبطة بالسؤال.
5. لا تكرر النصوص حرفيًا إلا عند الحاجة إلى توضيح قصير.
6. اكتب بالعربية الفصحى الواضحة وبأسلوب أكاديمي.
7. إذا كانت الأدلة غير كافية، صرّح بذلك بوضوح.
8. يمكنك إضافة معرفة تاريخية عامة في قسم مستقل عنوانه:
   "إثراء سياقي من الذكاء الاصطناعي".
9. يجب أن توضّح أن الإثراء السياقي ليس مستخرجًا من المستند.
10. لا تخلط بين معلومات المستند ومعرفة النموذج.
11. لا تخترع مصدرًا أو رقم صفحة.
12. اختر فقط الأدلة التي دعمت الإجابة فعلًا.
13. لكل دليل مختار، أعد evidenceIndex الصحيح.
14. أعد cleanedText بصياغة عربية سليمة وواضحة.
15. أصلح فقط أخطاء OCR وتقطيع الكلمات وعلامات الترقيم.
16. لا تضف إلى cleanedText معلومات غير موجودة في الدليل الأصلي.
17. لا تعرض النص الخام المشوه كما هو.
18. حافظ على المعنى التاريخي والأسماء والتواريخ الواردة في الدليل.
19. إذا تعذر فهم دليل بسبب شدة التشوه، فلا تستخدمه.
20. اجعل الإجابة منظمة بحسب الحاجة، مثل:
   - الإجابة من المستند
   - التحليل والاستنتاج
   - إثراء سياقي من الذكاء الاصطناعي
21. إذا كان السؤال يطلب استخراجًا، اعرض العناصر بوضوح.
22. إذا كان السؤال يطلب تحليلًا أو مناقشة، اربط بين الأسباب والنتائج والسياقات.
23. عند تحليل العلاقة بين الشخصيات والأحداث، اربط كل شخصية بالأحداث التي شاركت فيها أو أثرت فيها بحسب الأدلة المتاحة.
24. الحقول evidenceIndex و cleanedText بيانات داخلية مخصصة للنظام فقط.
25. ممنوع منعًا باتًا كتابة الكلمات evidenceIndex أو cleanedText داخل حقل answer.
26. لا تعرض JSON أو أسماء الحقول البرمجية داخل answer.
27. حقل answer يجب أن يحتوي فقط على الإجابة الأكاديمية الموجهة للباحث.
28. استخدم evidenceIndex و cleanedText فقط داخل مصفوفة evidence المخصصة لهما.
        `.trim(),

        input: `
سؤال الباحث:

${question}

نوع الطلب:
${mode}

الأدلة المستخرجة من المستند:

${evidenceText}
        `.trim(),

        text: {
          format: {
            type: "json_schema",
            name:
              "document_answer",
            description:
              "إجابة بحثية منظمة مع تحديد الأدلة المنقحة المستخدمة.",
            strict: true,
            schema:
              DOCUMENT_ANSWER_SCHEMA,
          },
        },
      });

    console.log(
      "Document answer status:",
      response.status
    );

    console.log(
      "Document answer usage:",
      response.usage
    );

    if (
      response.status ===
      "incomplete"
    ) {
      const reason =
        response
          .incomplete_details
          ?.reason;

      throw new Error(
        reason ===
          "max_output_tokens"
          ? "لم يكتمل رد OpenAI بسبب حد الإخراج."
          : `لم يكتمل رد OpenAI. السبب: ${
              reason ??
              "غير معروف"
            }`
      );
    }

    const outputText =
      response.output_text?.trim();

    if (!outputText) {
      console.error(
        "Document answer raw output:",
        JSON.stringify(
          response.output,
          null,
          2
        )
      );

      throw new Error(
        "وصل رد من OpenAI دون إجابة نصية."
      );
    }

    const parsed: unknown =
      JSON.parse(outputText);

    const modelAnswer =
      validateModelAnswer(
        parsed,
        selectedResults.length
      );

    const selectedEvidence: SelectedEvidenceItem[] =
      modelAnswer.evidence
        .map((item) => {
          const source =
            selectedResults[
              item.evidenceIndex - 1
            ];

          if (!source) {
            return null;
          }

          return {
            source,

            cleanedText:
              cleanText(
                item.cleanedText,
                900
              ),
          };
        })
        .filter(
          (
            item
          ): item is SelectedEvidenceItem =>
            item !== null
        );

    /*
     * إذا لم يختر النموذج أدلة واضحة،
     * نستخدم أفضل نتيجة واحدة فقط بصورة مؤقتة.
     * لكن لا نعرض عددًا كبيرًا من النصوص الخام.
     */
    const finalEvidence: SelectedEvidenceItem[] =
      selectedEvidence.length > 0
        ? selectedEvidence
        : selectedResults
            .slice(0, 1)
            .map((source) => ({
              source,

              cleanedText:
                cleanText(
                  source.text,
                  900
                ),
            }));

    const pages = Array.from(
      new Set(
        finalEvidence
          .map(
            (item) =>
              item.source.page
          )
          .filter(
            (
              page
            ): page is number =>
              typeof page ===
              "number"
          )
      )
    ).sort(
      (a, b) => a - b
    );

    const firstEvidence =
      finalEvidence[0];

    const evidence: DocumentAnswerEvidence[] =
      finalEvidence.map(
        (item) => ({
          text:
            item.cleanedText,

          page:
            item.source.page,
        })
      );

    return {
      answer:
        cleanFinalAnswer(
          modelAnswer.answer
        ),

      /*
       * متروك مؤقتًا فقط حتى نعدّل الواجهة.
       * سيُلغى عرضه بعد استخدام evidence[].
       */
      quote:
        firstEvidence
          ?.cleanedText ?? "",

      page:
        firstEvidence
          ?.source.page ??
        null,

      pages,

      evidence,

      confidence:
        modelAnswer.confidence,

      evidenceCount:
        evidence.length,

      mode,
    };
  } catch (error) {
    console.error(
      "GENERATE DOCUMENT ANSWER ERROR:",
      error
    );

    throw getFriendlyOpenAIError(
      error
    );
  }
}