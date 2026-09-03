import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AcademicReviewWorkspace from "@/components/academic-review/AcademicReviewWorkspace";

export default async function AcademicReviewDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const reviewId = Number(id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) notFound();

  const review = await prisma.academicReview.findFirst({
    where: { id: reviewId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      reviewLevel: true,
      status: true,
      totalPages: true,
      processedPages: true,
      processingError: true,
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
        },
      },
    },
  });

  if (!review) notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-[#06101d] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <a href="/academic-review" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">العودة إلى ملفات المراجعة</a>
          <Link href="/" className="text-3xl font-black text-amber-400">أثر</Link>
        </header>
        <AcademicReviewWorkspace review={review} />
      </div>
    </main>
  );
}
