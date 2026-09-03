import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkSubscription } from "@/lib/subscription/checkSubscription";
import { extractAcademicDocument } from "@/lib/academic-review/extractAcademicDocument";

export const runtime = "nodejs";
export const maxDuration = 300;

const FREE_MAX_FILE_SIZE = 50 * 1024 * 1024;
const PAID_MAX_FILE_SIZE = 150 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const reviews = await prisma.academicReview.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      fileType: true,
      reviewLevel: true,
      status: true,
      totalPages: true,
      processedPages: true,
      processingError: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  let uploadedUrl: string | null = null;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    }

    const subscriptionCheck = await checkSubscription(session.user.id);
    if (!subscriptionCheck.allowed) {
      return NextResponse.json({ error: subscriptionCheck.message }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const requestedLevel = formData.get("reviewLevel");
    const reviewLevel = requestedLevel === "LANGUAGE" ? "LANGUAGE" : "FULL";

    if (!file || typeof file === "string" || file.size <= 0) {
      return NextResponse.json({ error: "اختاري ملفًا صالحًا." }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
      return NextResponse.json({ error: "يتم دعم PDF وWord (.docx) فقط." }, { status: 400 });
    }

    const maxSize = subscriptionCheck.subscription.plan === "FREE"
      ? FREE_MAX_FILE_SIZE
      : PAID_MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "حجم الملف أكبر من الحد المسموح في باقتك." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractAcademicDocument(buffer, file.name);

    if (extraction.totalPages > subscriptionCheck.subscription.totalRemainingPages) {
      return NextResponse.json(
        { error: `الرصيد غير كافٍ. الملف يحتاج ${extraction.totalPages} صفحة.` },
        { status: 403 }
      );
    }

    const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, "-");
    const blob = await put(
      `academic-reviews/${session.user.id}/${Date.now()}-${safeName}`,
      buffer,
      { access: "private", addRandomSuffix: true, contentType: file.type || undefined }
    );
    uploadedUrl = blob.url;

    const review = await prisma.academicReview.create({
      data: {
        userId: session.user.id,
        name: file.name,
        originalUrl: blob.url,
        fileType: extraction.fileType,
        reviewLevel,
        totalPages: extraction.totalPages,
        sections: { create: extraction.sections },
      },
      select: {
        id: true,
        name: true,
        status: true,
        totalPages: true,
        processedPages: true,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (uploadedUrl) {
      try { await del(uploadedUrl); } catch { /* best-effort cleanup */ }
    }

    console.error("ACADEMIC REVIEW UPLOAD ERROR:", error);

    const internalMessage =
      error instanceof Error ? error.message : "";

    const isStorageConfigurationError =
      internalMessage.includes("No blob credentials") ||
      internalMessage.includes("BLOB_READ_WRITE_TOKEN") ||
      internalMessage.includes("VERCEL_OIDC_TOKEN");

    const message = isStorageConfigurationError
      ? "تعذر الاتصال بخدمة تخزين الملفات في البيئة الحالية."
      : internalMessage || "تعذر رفع ملف المراجعة.";

    return NextResponse.json(
      { error: message },
      { status: isStorageConfigurationError ? 503 : 500 }
    );
  }
}
