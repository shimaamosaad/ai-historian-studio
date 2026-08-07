import { prisma } from "@/lib/prisma";

import {
  splitIntoSections,
  getSectionSummary,
} from "./splitIntoSections";

import {
  ensureDocumentSections,
  markSectionAnalysisFailed,
  refreshSectionProgress,
} from "./saveSections";

import {
  analyzePendingSections,
} from "./analyzeSection";

import {
  mergeDocumentSections,
} from "./mergeSections";

export type HierarchicalAnalysisStatus =
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type ProcessHierarchicalAnalysisOptions = {
  sectionsPerRun?: number;
  pagesPerSection?: number;
  maxCharactersPerSection?: number;
};

export type ProcessHierarchicalAnalysisResult = {
  documentId: number;
  status: HierarchicalAnalysisStatus;

  totalSections: number;
  processedSections: number;
  remainingSections: number;
  analyzedInThisRun: number;

  merged: boolean;
  message: string;
};

const DEFAULT_SECTIONS_PER_RUN = 1;
const DEFAULT_PAGES_PER_SECTION = 10;
const DEFAULT_MAX_CHARACTERS_PER_SECTION =
  45_000;

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      2000
    );
  }

  return "حدث خطأ غير معروف أثناء التحليل الهرمي للمستند.";
}

/**
 * يتأكد من إنشاء أقسام المستند.
 */
async function prepareDocumentSections({
  documentId,
  content,
  pagesPerSection,
  maxCharactersPerSection,
}: {
  documentId: number;
  content: string;
  pagesPerSection: number;
  maxCharactersPerSection: number;
}) {
  const sections =
    splitIntoSections(content, {
      pagesPerSection,
      maxCharactersPerSection,
    });

  if (sections.length === 0) {
    throw new Error(
      "تعذر تقسيم المستند إلى أقسام صالحة للتحليل."
    );
  }

  console.log(
    "========== PREPARE DOCUMENT SECTIONS =========="
  );

  console.log(
    "Document ID:",
    documentId
  );

  console.log(
    "Sections:",
    sections.length
  );

  console.log(
    "Section summary:",
    getSectionSummary(sections)
  );

  console.log(
    "==============================================="
  );

  return ensureDocumentSections(
    documentId,
    sections
  );
}

/**
 * ينفذ مرحلة واحدة من التحليل الهرمي.
 *
 * يتم استدعاؤه عدة مرات من مسار المعالجة:
 *
 * الطلب الأول:
 * - إنشاء الأقسام.
 * - تحليل قسم أو أكثر.
 *
 * الطلبات التالية:
 * - تحليل الأقسام التالية.
 *
 * الطلب الأخير:
 * - دمج جميع تحليلات الأقسام.
 * - إنهاء معالجة المستند.
 */
export async function processHierarchicalAnalysis(
  documentId: number,
  options: ProcessHierarchicalAnalysisOptions = {}
): Promise<ProcessHierarchicalAnalysisResult> {
  if (
    !Number.isInteger(documentId) ||
    documentId <= 0
  ) {
    throw new Error(
      "رقم المستند غير صحيح عند بدء التحليل الهرمي."
    );
  }

  const sectionsPerRun = Math.max(
    1,
    Math.min(
      3,
      Math.floor(
        options.sectionsPerRun ??
          DEFAULT_SECTIONS_PER_RUN
      )
    )
  );

  const pagesPerSection = Math.max(
    1,
    Math.floor(
      options.pagesPerSection ??
        DEFAULT_PAGES_PER_SECTION
    )
  );

  const maxCharactersPerSection =
    Math.max(
      5_000,
      Math.floor(
        options.maxCharactersPerSection ??
          DEFAULT_MAX_CHARACTERS_PER_SECTION
      )
    );

  const document =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },

      select: {
        id: true,
        content: true,
        processingStatus: true,

        sectionAnalysisStatus: true,
        processedSections: true,
        totalSections: true,
        sectionAnalysisError: true,

        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

  if (!document) {
    throw new Error(
      "المستند غير موجود عند بدء التحليل الهرمي."
    );
  }

  if (!document.content?.trim()) {
    throw new Error(
      "لا يوجد نص محفوظ داخل المستند لبدء التحليل الهرمي."
    );
  }

  try {
    /*
     * إنشاء الأقسام لأول مرة فقط.
     */
    if (
      document._count.sections === 0 ||
      document.totalSections === 0
    ) {
      await prepareDocumentSections({
        documentId,
        content:
          document.content,

        pagesPerSection,

        maxCharactersPerSection,
      });
    }

    /*
     * نحافظ على حالة المعالجة العامة
     * حتى تستمر الواجهة في استدعاء المسار.
     */
    await prisma.document.update({
      where: {
        id: documentId,
      },

      data: {
        processingStatus:
          "PROCESSING",

        processingError:
          null,

        sectionAnalysisError:
          null,
      },
    });

    const progressBefore =
      await refreshSectionProgress(
        documentId
      );

    /*
     * ما زالت هناك أقسام معلقة.
     */
    if (
      progressBefore.processedSections <
      progressBefore.totalSections
    ) {
      const analyzed =
        await analyzePendingSections(
          documentId,
          {
            sectionsPerRun,
          }
        );

      const progressAfter =
        await refreshSectionProgress(
          documentId
        );

      const remainingSections =
        Math.max(
          progressAfter.totalSections -
            progressAfter.processedSections,
          0
        );

      /*
       * إذا انتهى آخر قسم في نفس الطلب،
       * نكمل إلى الدمج مباشرة.
       */
      if (remainingSections > 0) {
        return {
          documentId,

          status:
            "PROCESSING",

          totalSections:
            progressAfter.totalSections,

          processedSections:
            progressAfter.processedSections,

          remainingSections,

          analyzedInThisRun:
            analyzed.analyzedSections,

          merged: false,

          message:
            `تم تحليل ${progressAfter.processedSections} من أصل ${progressAfter.totalSections} قسمًا.`,
        };
      }
    }

    /*
     * كل الأقسام اكتملت.
     * ندمجها للحصول على فهم شامل للمستند.
     */
    const finalProgress =
      await refreshSectionProgress(
        documentId
      );

    if (
      finalProgress.totalSections === 0
    ) {
      throw new Error(
        "لا توجد أقسام متاحة لدمج تحليل المستند."
      );
    }

    if (
      finalProgress.processedSections !==
      finalProgress.totalSections
    ) {
      const remainingSections =
        Math.max(
          finalProgress.totalSections -
            finalProgress.processedSections,
          0
        );

      return {
        documentId,

        status:
          "PROCESSING",

        totalSections:
          finalProgress.totalSections,

        processedSections:
          finalProgress.processedSections,

        remainingSections,

        analyzedInThisRun: 0,

        merged: false,

        message:
          "ما زال تحليل بعض أقسام المستند مستمرًا.",
      };
    }

    await prisma.document.update({
      where: {
        id: documentId,
      },

      data: {
        sectionAnalysisStatus:
          "MERGING",

        sectionAnalysisError:
          null,
      },
    });

    await mergeDocumentSections(
      documentId
    );

    const completedDocument =
      await prisma.document.update({
        where: {
          id: documentId,
        },

        data: {
          processingStatus:
            "COMPLETED",

          sectionAnalysisStatus:
            "COMPLETED",

          processingError:
            null,

          sectionAnalysisError:
            null,
        },

        select: {
          totalSections: true,
          processedSections: true,
        },
      });

    return {
      documentId,

      status:
        "COMPLETED",

      totalSections:
        completedDocument.totalSections,

      processedSections:
        completedDocument.processedSections,

      remainingSections: 0,

      analyzedInThisRun: 0,

      merged: true,

      message:
        "اكتمل تحليل جميع أقسام المستند ودمجها في تحليل شامل.",
    };
 } catch (error) {
  const message =
    getErrorMessage(error);

  console.error(
    "HIERARCHICAL ANALYSIS ERROR:",
    error
  );

  /*
   * لو المشكلة أثناء دمج الأقسام،
   * لا نحول المستند كله إلى FAILED.
   * لأن OCR والأقسام تم حفظهم بالفعل.
   */

  await prisma.document.update({
    where: {
      id: documentId,
    },

    data: {
      sectionAnalysisStatus:
        "FAILED",

      sectionAnalysisError:
        message,

      processingStatus:
        "PROCESSING",

      processingError:
        null,
    },
  });

  throw error;
}
}