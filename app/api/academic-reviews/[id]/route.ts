import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function parseChanges(value: string | null) {
  if (!value) return [];
  try { return JSON.parse(value); } catch { return []; }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "رقم المراجعة غير صحيح." }, { status: 400 });
  }

  const review = await prisma.academicReview.findFirst({
    where: { id: reviewId, userId: session.user.id },
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
      sections: {
        orderBy: { sectionIndex: "asc" },
        select: {
          id: true,
          sectionIndex: true,
          startPage: true,
          endPage: true,
          originalText: true,
          reviewedText: true,
          changes: true,
          processingStatus: true,
          processingError: true,
        },
      },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "ملف المراجعة غير موجود." }, { status: 404 });
  }

  return NextResponse.json({
    review: {
      ...review,
      sections: review.sections.map((section) => ({
        ...section,
        changes: parseChanges(section.changes),
      })),
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = Number(id);
  const review = await prisma.academicReview.findFirst({
    where: { id: reviewId, userId: session.user.id },
    select: { id: true, originalUrl: true },
  });

  if (!review) {
    return NextResponse.json({ error: "ملف المراجعة غير موجود." }, { status: 404 });
  }

  await prisma.academicReview.delete({ where: { id: review.id } });
  if (review.originalUrl.includes(".blob.vercel-storage.com/")) {
    try { await del(review.originalUrl); } catch { /* database deletion already succeeded */ }
  }

  return NextResponse.json({ success: true });
}
