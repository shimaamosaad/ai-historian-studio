import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchDocument } from "@/lib/ai/searchDocument";

export const runtime = "nodejs";
export const maxDuration = 300;

function createShortQuote(text: string, maxLength = 700): string {
  const cleanText = text.replace(/\s+/g, " ").trim();

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return `${cleanText.slice(0, maxLength).trim()}...`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentId = Number(id);

    if (!Number.isInteger(documentId) || documentId <= 0) {
      return NextResponse.json(
        { error: "رقم المستند غير صحيح" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return NextResponse.json(
        { error: "اكتب سؤالًا عن المستند" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        name: true,
        content: true,
        processingStatus: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "المستند غير موجود" },
        { status: 404 }
      );
    }

    if (document.processingStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: "المستند لم يكتمل تحليله بعد" },
        { status: 409 }
      );
    }

    if (!document.content?.trim()) {
      return NextResponse.json(
        { error: "لا يوجد نص مستخرج من المستند" },
        { status: 400 }
      );
    }

    const results = searchDocument(
      document.content,
      question,
      {
        chunkSize: 1800,
        overlap: 300,
        maxResults: 6,
      }
    );

    if (results.length === 0) {
      return NextResponse.json({
        document: {
          id: document.id,
          name: document.name,
        },
        question,
        answer:
          "لم يتم العثور على إجابة واضحة مرتبطة بالسؤال داخل هذا المستند.",
        page: null,
        quote: null,
        score: 0,
        results: [],
      });
    }

    const bestResult = results[0];

    const answer = createShortQuote(
      bestResult.text,
      1000
    );

    const quote = createShortQuote(
      bestResult.text,
      700
    );

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.name,
      },
      question,
      answer,
      page: bestResult.page,
      quote,
      score: bestResult.score,
      results: results.map((result, index) => ({
        rank: index + 1,
        score: result.score,
        chunkIndex: result.chunkIndex,
        page: result.page,
        text: result.text,
      })),
    });
  } catch (error) {
    console.error("Ask document error:", error);

    return NextResponse.json(
      {
        error: "حدث خطأ أثناء البحث داخل المستند",
      },
      {
        status: 500,
      }
    );
  }
}