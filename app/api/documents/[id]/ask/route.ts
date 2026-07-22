import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
  parseDocumentQuestion,
  searchDocument,
} from "@/lib/ai/searchDocument";

import { generateAnswer } from "@/lib/ai/generateAnswer";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    const { id } = await params;
    const documentId = Number(id);

    if (
      !Number.isInteger(
        documentId
      ) ||
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
      await prisma.document.findUnique(
        {
          where: {
            id: documentId,
          },
          select: {
            id: true,
            name: true,
            content: true,
            processingStatus: true,
            totalPages: true,
          },
        }
      );

    if (!document) {
      return NextResponse.json(
        {
          error:
            "المستند غير موجود",
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

    const parsedQuestion =
      parseDocumentQuestion(
        question
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
      parsedQuestion.endPage !==
        null &&
      document.totalPages
        ? Math.min(
            parsedQuestion.endPage,
            document.totalPages
          )
        : parsedQuestion.endPage;

    const hasTopic =
      parsedQuestion.searchQuery
        .trim().length > 0;

    const results =
      searchDocument(
        document.content,
        parsedQuestion.searchQuery,
        {
          chunkSize: 1600,
          overlap: 250,

          maxResults: 500,

maxResultsPerPage: 20,

          startPage,
          endPage,

          includeAllRangeChunks:
            parsedQuestion.hasPageRange &&
            !hasTopic,
        }
      );

    if (
      results.length === 0
    ) {
      return NextResponse.json({
        document: {
          id: document.id,
          name: document.name,
        },

        question,

        request: {
          mode:
            parsedQuestion.mode,
          searchQuery:
            parsedQuestion.searchQuery,
          startPage,
          endPage,
        },

        answer:
          parsedQuestion.hasPageRange
            ? "لم يتم العثور على معلومات واضحة مرتبطة بالطلب داخل نطاق الصفحات المحدد."
            : "لم يتم العثور على إجابة واضحة مرتبطة بالسؤال داخل هذا المستند.",

        page: null,
        pages: [],
        quote: null,
        score: 0,
        evidenceCount: 0,
        results: [],
      });
    }

    const generated =
      generateAnswer(
        question,
        results,
        {
          ...parsedQuestion,
          startPage,
          endPage,
        }
      );

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.name,
      },

      question,

      request: {
        mode: generated.mode,
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

      score:
        generated.confidence,

      evidenceCount:
        generated.evidenceCount,

      results:
        results.map(
          (result, index) => ({
            rank: index + 1,
            score: result.score,
            chunkIndex:
              result.chunkIndex,
            page: result.page,
            matchedTerms:
              result.matchedTerms,
            text: result.text,
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
          "حدث خطأ أثناء البحث وتحليل المستند",
      },
      {
        status: 500,
      }
    );
  }
}