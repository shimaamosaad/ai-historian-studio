import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { reviewAcademicSection } from "@/lib/academic-review/reviewSection";

export const runtime = "nodejs";
export const maxDuration = 300;

async function chargeReviewPages(reviewId: number, userId: string) {
  await prisma.$transaction(async (tx) => {
    const review = await tx.academicReview.findFirst({
      where: { id: reviewId, userId },
      select: { billedPages: true, totalPages: true },
    });

    if (!review || review.billedPages > 0) return;

    const claim = await tx.academicReview.updateMany({
      where: { id: reviewId, userId, billedPages: 0 },
      data: {
        billedPages: review.totalPages,
        status: "PROCESSING",
        processingError: null,
      },
    });

    if (claim.count === 0) return;

    const subscription = await tx.subscription.findUnique({
      where: { userId },
      select: { pageLimit: true, usedPages: true, extraPages: true },
    });

    if (!subscription) throw new Error("لا يوجد اشتراك مرتبط بهذا الحساب.");

    const regularAvailable = Math.max(subscription.pageLimit - subscription.usedPages, 0);
    const regularToUse = Math.min(regularAvailable, review.totalPages);
    const extraToUse = review.totalPages - regularToUse;

    if (extraToUse > subscription.extraPages) {
      throw new Error("رصيد الصفحات غير كافٍ لإجراء المراجعة.");
    }

    await tx.subscription.update({
      where: { userId },
      data: {
        usedPages: { increment: regularToUse },
        ...(extraToUse > 0 ? { extraPages: { decrement: extraToUse } } : {}),
      },
    });

    await tx.academicReview.update({
      where: { id: reviewId },
      data: {
        usageSource: extraToUse > 0 ? "BASE_AND_EXTRA" : "BASE",
      },
    });
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        reviewLevel: true,
        status: true,
        totalPages: true,
        processedPages: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "ملف المراجعة غير موجود." }, { status: 404 });
    }

    if (review.status === "COMPLETED") {
      return NextResponse.json({ review });
    }

    await chargeReviewPages(reviewId, session.user.id);

    const section = await prisma.academicReviewSection.findFirst({
      where: {
        reviewId,
        processingStatus: { in: ["PENDING", "FAILED"] },
      },
      orderBy: { sectionIndex: "asc" },
    });

    if (!section) {
      const processingSections = await prisma.academicReviewSection.count({
        where: { reviewId, processingStatus: "PROCESSING" },
      });

      if (processingSections > 0) {
        return NextResponse.json({
          review: { ...review, status: "PROCESSING" },
        });
      }

      const completed = await prisma.academicReview.update({
        where: { id: reviewId },
        data: { status: "COMPLETED", processedPages: review.totalPages, processingError: null },
        select: { id: true, status: true, totalPages: true, processedPages: true },
      });
      return NextResponse.json({ review: completed });
    }

    const sectionClaim = await prisma.academicReviewSection.updateMany({
      where: {
        id: section.id,
        processingStatus: { in: ["PENDING", "FAILED"] },
      },
      data: { processingStatus: "PROCESSING", processingError: null },
    });

    if (sectionClaim.count === 0) {
      return NextResponse.json({
        review: { ...review, status: "PROCESSING" },
      });
    }

    try {
      const result = await reviewAcademicSection({
        text: section.originalText,
        reviewLevel: review.reviewLevel,
      });

      await prisma.academicReviewSection.update({
        where: { id: section.id },
        data: {
          reviewedText: result.reviewedText,
          changes: JSON.stringify(result.changes),
          processingStatus: "COMPLETED",
          processingError: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر مراجعة هذا الجزء.";
      await prisma.academicReviewSection.update({
        where: { id: section.id },
        data: { processingStatus: "FAILED", processingError: message },
      });
      await prisma.academicReview.update({
        where: { id: reviewId },
        data: { status: "FAILED", processingError: message },
      });
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const sections = await prisma.academicReviewSection.findMany({
      where: { reviewId },
      select: { startPage: true, endPage: true, processingStatus: true },
    });
    const completedSections = sections.filter((item) => item.processingStatus === "COMPLETED");
    const allCompleted = completedSections.length === sections.length;
    const processedPages = Math.min(
      review.totalPages,
      completedSections.reduce((total, item) => total + item.endPage - item.startPage + 1, 0)
    );

    const updatedReview = await prisma.academicReview.update({
      where: { id: reviewId },
      data: {
        status: allCompleted ? "COMPLETED" : "PROCESSING",
        processedPages: allCompleted ? review.totalPages : processedPages,
        processingError: null,
      },
      select: { id: true, name: true, status: true, totalPages: true, processedPages: true },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر استكمال المراجعة.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
