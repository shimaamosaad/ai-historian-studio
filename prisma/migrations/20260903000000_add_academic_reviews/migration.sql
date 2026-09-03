CREATE TABLE "AcademicReview" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "reviewLevel" TEXT NOT NULL DEFAULT 'FULL',
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "processedPages" INTEGER NOT NULL DEFAULT 0,
    "billedPages" INTEGER NOT NULL DEFAULT 0,
    "usageSource" TEXT,
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicReviewSection" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "sectionIndex" INTEGER NOT NULL,
    "startPage" INTEGER NOT NULL,
    "endPage" INTEGER NOT NULL,
    "originalText" TEXT NOT NULL,
    "reviewedText" TEXT,
    "changes" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicReviewSection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcademicReview_userId_createdAt_idx" ON "AcademicReview"("userId", "createdAt");
CREATE INDEX "AcademicReview_status_idx" ON "AcademicReview"("status");
CREATE INDEX "AcademicReviewSection_reviewId_idx" ON "AcademicReviewSection"("reviewId");
CREATE INDEX "AcademicReviewSection_processingStatus_idx" ON "AcademicReviewSection"("processingStatus");
CREATE UNIQUE INDEX "AcademicReviewSection_reviewId_sectionIndex_key" ON "AcademicReviewSection"("reviewId", "sectionIndex");

ALTER TABLE "AcademicReview"
ADD CONSTRAINT "AcademicReview_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AcademicReviewSection"
ADD CONSTRAINT "AcademicReviewSection_reviewId_fkey"
FOREIGN KEY ("reviewId") REFERENCES "AcademicReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
