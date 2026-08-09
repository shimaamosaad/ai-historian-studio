import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import {
  parseDocumentQuestion,
  searchDocument,
} from "@/lib/ai/searchDocument";

import { generateDocumentAnswer } from "@/lib/ai/generateDocumentAnswer";

export const runtime = "nodejs";
export const maxDuration = 300;

type HistoryItem = {
  question: string;
  answer: string;
};

const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_ANSWER_CHARACTERS = 3000;

function buildHistory(
  messages: {
    role: string;
    content: string;
  }[]
): HistoryItem[] {
  const history: HistoryItem[] = [];

  let pendingQuestion:
    string | null = null;

  for (const message of messages) {
    if (message.role === "user") {
      pendingQuestion =
        message.content;
      continue;
    }

    if (
      message.role ===
        "assistant" &&
      pendingQuestion
    ) {
      history.push({
        question:
          pendingQuestion,
        answer:
          message.content.slice(
            0,
            MAX_HISTORY_ANSWER_CHARACTERS
          ),
      });

      pendingQuestion = null;
    }
  }

  return history.slice(
    -MAX_HISTORY_ITEMS
  );
}

function buildContextualQuestion(
  question: string,
  history: HistoryItem[]
): string {
  if (history.length === 0) {
    return question;
  }

  const recentQuestions =
    history
      .slice(-3)
      .map(
        (item) =>
          item.question
      )
      .join(" ");

  return `${recentQuestions} ${question}`
    .replace(/\s+/g, " ")
    .trim();
}

function buildGenerationQuestion(
  question: string,
  history: HistoryItem[]
): string {
  if (history.length === 0) {
    return question;
  }

  const context =
    history
      .slice(-3)
      .map(
        (item, index) =>
          `السؤال السابق ${index + 1}: ${item.question}\nالإجابة السابقة: ${item.answer}`
      )
      .join("\n\n");

  return [
    "سياق المحادثة السابقة:",
    context,
    "",
    `السؤال الحالي: ${question}`,
    "",
    "استخدم السياق السابق لفهم الضمائر والإشارات في السؤال الحالي، لكن اعتمد في الحقائق على نص المستند والأدلة الحالية فقط.",
  ].join("\n");
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
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    const documentId = Number(id);

    if (
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "رقم المستند غير صحيح",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const question =
      typeof body?.question ===
        "string"
        ? body.question.trim()
        : "";

    const requestedConversationId =
      Number.isInteger(
        Number(
          body?.conversationId
        )
      ) &&
      Number(
        body?.conversationId
      ) > 0
        ? Number(
            body.conversationId
          )
        : null;

    if (!question) {
      return NextResponse.json(
        {
          error:
            "اكتب سؤالًا عن المستند",
        },
        {
          status: 400,
        }
      );
    }

    const document =
      await prisma.document.findFirst({
        where: {
          id: documentId,
          project: {
            userId:
              session.user.id,
          },
        },
        select: {
          id: true,
          name: true,
          content: true,
          processingStatus: true,
          totalPages: true,
          projectId: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          error:
            "المستند غير موجود أو لا تملك صلاحية الوصول إليه",
        },
        {
          status: 404,
        }
      );
    }

    if (
      document.processingStatus !==
      "COMPLETED"
    ) {
      return NextResponse.json(
        {
          error:
            "المستند لم يكتمل تحليله بعد",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !document.content?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "لا يوجد نص مستخرج من المستند",
        },
        {
          status: 400,
        }
      );
    }

    let conversation =
      requestedConversationId
        ? await prisma.projectConversation.findFirst({
            where: {
              id:
                requestedConversationId,
              projectId:
                document.projectId,
              documentId:
                document.id,
              project: {
                userId:
                  session.user.id,
              },
            },
            include: {
              messages: {
                orderBy: {
                  createdAt:
                    "asc",
                },
              },
            },
          })
        : null;

    if (!conversation) {
      conversation =
        await prisma.projectConversation.create({
          data: {
            projectId:
              document.projectId,
            documentId:
              document.id,
            title:
              "محادثة مع المستند",
          },
          include: {
            messages: true,
          },
        });
    }

    const history =
      buildHistory(
        conversation.messages
      );

    const contextualQuestion =
      buildContextualQuestion(
        question,
        history
      );

    const parsedQuestion =
      parseDocumentQuestion(
        contextualQuestion
      );

    if (
      parsedQuestion.startPage !==
        null &&
      document.totalPages &&
      parsedQuestion.startPage >
        document.totalPages
    ) {
      return NextResponse.json(
        {
          error: `رقم الصفحة المطلوبة أكبر من عدد صفحات المستند. عدد الصفحات هو ${document.totalPages}.`,
        },
        {
          status: 400,
        }
      );
    }

    const startPage =
      parsedQuestion.startPage;

    const endPage =
      parsedQuestion.endPage !== null &&
      document.totalPages
        ? Math.min(
            parsedQuestion.endPage,
            document.totalPages
          )
        : parsedQuestion.endPage;

    const hasTopic =
      parsedQuestion.searchQuery
        .trim().length > 0;

    let results =
      searchDocument(
        document.content,
        parsedQuestion.searchQuery,
        {
          chunkSize: 1600,
          overlap: 250,
          maxResults: 12,
          maxResultsPerPage: 3,
          startPage,
          endPage,
          includeAllRangeChunks:
            parsedQuestion.hasPageRange &&
            !hasTopic,
        }
      );

    const needsBroadDocumentContext =
      results.length === 0 &&
      (
        parsedQuestion.mode ===
          "analysis" ||
        parsedQuestion.mode ===
          "summary"
      );

    if (
      needsBroadDocumentContext
    ) {
      results =
        searchDocument(
          document.content,
          "",
          {
            chunkSize: 1600,
            overlap: 200,
            maxResults: 12,
            maxResultsPerPage: 1,
            startPage,
            endPage,
            includeAllRangeChunks:
              true,
          }
        );
    }

    if (
      results.length === 0
    ) {
      return NextResponse.json({
        document: {
          id: document.id,
          name:
            document.name,
        },
        question,
        conversationId:
          conversation.id,
        answer:
          parsedQuestion.hasPageRange
            ? "لم يتم العثور على معلومات واضحة مرتبطة بالطلب داخل نطاق الصفحات المحدد."
            : "لم يتم العثور على إجابة واضحة مرتبطة بالسؤال داخل هذا المستند.",
        page: null,
        pages: [],
        quote: null,
        evidence: [],
        score: 0,
        confidence: 0,
        evidenceCount: 0,
        results: [],
      });
    }

    const generationQuestion =
      buildGenerationQuestion(
        question,
        history
      );

    const generated =
      await generateDocumentAnswer(
        generationQuestion,
        results,
        parsedQuestion.mode
      );

    const metadata =
      JSON.stringify({
        page:
          generated.page,
        pages:
          generated.pages,
        quote:
          generated.quote,
        evidence:
          generated.evidence,
        score:
          generated.confidence,
      });

    const currentMessageCount =
      await prisma.projectMessage.count({
        where: {
          conversationId:
            conversation.id,
        },
      });

    await prisma.$transaction([
      prisma.projectMessage.create({
        data: {
          conversationId:
            conversation.id,
          role: "user",
          content:
            question,
        },
      }),

      prisma.projectMessage.create({
        data: {
          conversationId:
            conversation.id,
          role:
            "assistant",
          content:
            generated.answer,
          confidence:
            generated.confidence,
          sourceDocumentCount:
            1,
          metadata,
        },
      }),

      prisma.projectConversation.update({
        where: {
          id:
            conversation.id,
        },
        data: {
          updatedAt:
            new Date(),
          ...(currentMessageCount ===
          0
            ? {
                title:
                  question.slice(
                    0,
                    80
                  ),
              }
            : {}),
        },
      }),
    ]);

    return NextResponse.json({
      document: {
        id: document.id,
        name:
          document.name,
      },
      question,
      conversationId:
        conversation.id,
      request: {
        mode:
          generated.mode,
        searchQuery:
          parsedQuestion.searchQuery,
        startPage,
        endPage,
      },
      answer:
        generated.answer,
      page:
        generated.page,
      pages:
        generated.pages,
      quote:
        generated.quote,
      evidence:
        generated.evidence,
      score:
        generated.confidence,
      confidence:
        generated.confidence,
      evidenceCount:
        generated.evidenceCount,
      results:
        results.map(
          (
            result,
            index
          ) => ({
            rank:
              index + 1,
            score:
              result.score,
            chunkIndex:
              result.chunkIndex,
            page:
              result.page,
            matchedTerms:
              result.matchedTerms,
            text:
              result.text,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Ask document error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء البحث وتحليل المستند",
      },
      {
        status: 500,
      }
    );
  }
}