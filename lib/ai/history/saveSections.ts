import { prisma } from "@/lib/prisma";

import type {
  DocumentPageSection,
} from "./splitIntoSections";

export type SaveSectionsResult = {
  documentId: number;
  totalSections: number;
  processedSections: number;
  sectionAnalysisStatus: string;
};

/**
 * يحذف الأقسام القديمة للمستند،
 * ثم ينشئ الأقسام الجديدة بحالة PENDING.
 *
 * نستخدم Transaction حتى لا يبقى المستند
 * بنصف أقسام فقط لو حدث خطأ أثناء الحفظ.
 */
export async function saveDocumentSections(
  documentId: number,
  sections: DocumentPageSection[]
): Promise<SaveSectionsResult> {
  if (
    !Number.isInteger(documentId) ||
    documentId <= 0
  ) {
    throw new Error(
      "رقم المستند غير صحيح عند حفظ الأقسام."
    );
  }

  const document =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
      },
    });

  if (!document) {
    throw new Error(
      "تعذر حفظ الأقسام لأن المستند غير موجود."
    );
  }

  const validSections = sections.filter(
    (section) =>
      Number.isInteger(
        section.sectionIndex
      ) &&
      section.sectionIndex >= 0 &&
      Number.isInteger(
        section.startPage
      ) &&
      section.startPage > 0 &&
      Number.isInteger(
        section.endPage
      ) &&
      section.endPage >=
        section.startPage &&
      section.content.trim().length > 0
  );

  if (validSections.length === 0) {
    await prisma.$transaction([
      prisma.documentSection.deleteMany({
        where: {
          documentId,
        },
      }),

      prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          sectionAnalysisStatus:
            "COMPLETED",

          processedSections: 0,

          totalSections: 0,

          sectionAnalysisError:
            null,
        },
      }),
    ]);

    return {
      documentId,
      totalSections: 0,
      processedSections: 0,
      sectionAnalysisStatus:
        "COMPLETED",
    };
  }

  const uniqueIndexes =
    new Set<number>();

  for (const section of validSections) {
    if (
      uniqueIndexes.has(
        section.sectionIndex
      )
    ) {
      throw new Error(
        `رقم القسم ${section.sectionIndex} مكرر داخل المستند.`
      );
    }

    uniqueIndexes.add(
      section.sectionIndex
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      /*
       * عند إعادة معالجة المستند،
       * نحذف الأقسام القديمة أولًا.
       */
      await transaction.documentSection.deleteMany({
        where: {
          documentId,
        },
      });

      /*
       * createMany أسرع من إنشاء كل قسم
       * في استعلام منفصل.
       */
      await transaction.documentSection.createMany({
        data: validSections.map(
          (section) => ({
            documentId,

            sectionIndex:
              section.sectionIndex,

            startPage:
              section.startPage,

            endPage:
              section.endPage,

            content:
              section.content,

            summary: null,

            analysis: null,

            people: null,

            places: null,

            events: null,

            relations: null,

            keywords: null,

            processingStatus:
              "PENDING",

            processingError:
              null,
          })
        ),
      });

      await transaction.document.update({
        where: {
          id: documentId,
        },
        data: {
          sectionAnalysisStatus:
            "PENDING",

          processedSections: 0,

          totalSections:
            validSections.length,

          sectionAnalysisError:
            null,
        },
      });
    }
  );

  console.log(
    "========== DOCUMENT SECTIONS SAVED =========="
  );

  console.log(
    "Document ID:",
    documentId
  );

  console.log(
    "Total Sections:",
    validSections.length
  );

  console.log(
    "Pages:",
    validSections.map(
      (section) =>
        `${section.startPage}-${section.endPage}`
    )
  );

  console.log(
    "============================================="
  );

  return {
    documentId,

    totalSections:
      validSections.length,

    processedSections: 0,

    sectionAnalysisStatus:
      "PENDING",
  };
}

/**
 * يعيد إنشاء أقسام المستند فقط إذا لم تكن
 * موجودة من قبل، ويمكن استخدامه لاحقًا
 * لتفادي تكرار التقسيم بلا داعٍ.
 */
export async function ensureDocumentSections(
  documentId: number,
  sections: DocumentPageSection[]
): Promise<SaveSectionsResult> {
  const currentDocument =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },
      select: {
        id: true,
        totalSections: true,
        processedSections: true,
        sectionAnalysisStatus: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

  if (!currentDocument) {
    throw new Error(
      "المستند غير موجود."
    );
  }

  const sectionsAlreadyExist =
    currentDocument._count.sections > 0 &&
    currentDocument.totalSections ===
      currentDocument._count.sections;

  if (sectionsAlreadyExist) {
    return {
      documentId,

      totalSections:
        currentDocument.totalSections,

      processedSections:
        currentDocument.processedSections,

      sectionAnalysisStatus:
        currentDocument.sectionAnalysisStatus,
    };
  }

  return saveDocumentSections(
    documentId,
    sections
  );
}

/**
 * يستخدم عند بدء تحليل الأقسام.
 */
export async function markSectionAnalysisStarted(
  documentId: number
) {
  return prisma.document.update({
    where: {
      id: documentId,
    },
    data: {
      sectionAnalysisStatus:
        "PROCESSING",

      sectionAnalysisError:
        null,
    },
  });
}

/**
 * يستخدم عند حدوث خطأ عام أثناء
 * تحليل أقسام المستند.
 */
export async function markSectionAnalysisFailed(
  documentId: number,
  message: string
) {
  return prisma.document.update({
    where: {
      id: documentId,
    },
    data: {
      sectionAnalysisStatus:
        "FAILED",

      sectionAnalysisError:
        message.slice(0, 2000),
    },
  });
}

/**
 * يعيد حساب عدد الأقسام المكتملة
 * ويحدّث حالة المستند.
 */
export async function refreshSectionProgress(
  documentId: number
) {
  const [
    totalSections,
    processedSections,
    failedSections,
  ] = await Promise.all([
    prisma.documentSection.count({
      where: {
        documentId,
      },
    }),

    prisma.documentSection.count({
      where: {
        documentId,
        processingStatus:
          "COMPLETED",
      },
    }),

    prisma.documentSection.count({
      where: {
        documentId,
        processingStatus:
          "FAILED",
      },
    }),
  ]);

  let sectionAnalysisStatus:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED";

  if (
    totalSections === 0 ||
    processedSections ===
      totalSections
  ) {
    sectionAnalysisStatus =
      "COMPLETED";
  } else if (
    failedSections > 0
  ) {
    sectionAnalysisStatus =
      "FAILED";
  } else if (
    processedSections > 0
  ) {
    sectionAnalysisStatus =
      "PROCESSING";
  } else {
    sectionAnalysisStatus =
      "PENDING";
  }

  const updatedDocument =
    await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        totalSections,

        processedSections,

        sectionAnalysisStatus,

        sectionAnalysisError:
          sectionAnalysisStatus ===
          "FAILED"
            ? "فشل تحليل قسم واحد أو أكثر من المستند."
            : null,
      },
      select: {
        id: true,
        totalSections: true,
        processedSections: true,
        sectionAnalysisStatus: true,
        sectionAnalysisError: true,
      },
    });

  return updatedDocument;
}