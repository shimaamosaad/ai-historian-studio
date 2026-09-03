import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AcademicReviewStudio from "@/components/academic-review/AcademicReviewStudio";

export default async function AcademicReviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [reviews, subscription] = await Promise.all([
    prisma.academicReview.findMany({
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
    }),
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { pageLimit: true, usedPages: true, extraPages: true },
    }),
  ]);

  const remainingPages = subscription
    ? Math.max(subscription.pageLimit - subscription.usedPages, 0) + subscription.extraPages
    : 0;

  return (
    <main dir="rtl" className="min-h-screen bg-[#06101d] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-3xl font-black text-amber-400">أثر</Link>
          <div className="flex gap-2">
            <Link href="/projects" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">مشاريعي</Link>
            <Link href="/subscription" className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm text-amber-200">اشتراكي</Link>
          </div>
        </header>

        <AcademicReviewStudio
          initialReviews={reviews.map((review) => ({
            ...review,
            createdAt: review.createdAt.toISOString(),
          }))}
          remainingPages={remainingPages}
        />
      </div>
    </main>
  );
}
