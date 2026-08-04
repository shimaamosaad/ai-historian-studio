import { prisma } from "@/lib/prisma";

import {
  runOpenAIStructured,
} from "@/lib/ai/core/openai";

import {
  SECTION_ANALYSIS_SCHEMA,
  validateSectionAnalysis,
  type SectionAnalysisResult,
} from "@/lib/ai/core/schemas";

import {
  markSectionAnalysisFailed,
  markSectionAnalysisStarted,
  refreshSectionProgress,
} from "./saveSections";

export type AnalyzeSectionResult = {
  sectionId: number;
  documentId: number;
  sectionIndex: number;
  startPage: number;
  endPage: number;
  status: "COMPLETED";
  analysis: SectionAnalysisResult;
};

export type AnalyzePendingSectionsResult = {
  documentId: number;
  analyzedSections: number;
  remainingSections: number;
  processedSections: number;
  totalSections: number;
  sectionAnalysisStatus: string;
};

type AnalyzePendingSectionsOptions = {
  sectionsPerRun?: number;
};

const DEFAULT_SECTIONS_PER_RUN = 1;
const MAX_SECTION_CHARACTERS = 45_000;

/**
 * تنظيف النص مع الاحتفاظ بعلامات الصفحات.
 */
function cleanSectionContent(
  content: string
): string {
  return content
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * تقليل طول النص عند الضرورة.
 *
 * التقسيم الأساسي يمنع غالبًا تجاوز الحد،
 * لكن هذا الفحص يوفر حماية إضافية.
 */
function limitSectionContent(
  content: string
): string {
  if (
    content.length <=
    MAX_SECTION_CHARACTERS
  ) {
    return content;
  }

  const shortened = content.slice(
    0,
    MAX_SECTION_CHARACTERS
  );

  const finalPageMarker =
    shortened.lastIndexOf(
      "[[PAGE:"
    );

  /*
   * لا نقطع عند آخر علامة صفحة إذا كانت
   * قريبة جدًا من بداية النص.
   */
  if (
    finalPageMarker >
    MAX_SECTION_CHARACTERS * 0.7
  ) {
    return shortened
      .slice(
        0,
        finalPageMarker
      )
      .trim();
  }

  return shortened.trim();
}

/**
 * تحويل المصفوفات والعلاقات إلى JSON
 * قبل حفظها داخل حقول String في SQLite.
 */
function stringifyValue(
  value: unknown
): string {
  return JSON.stringify(value);
}

/**
 * تعليمات تحليل جزء واحد من المستند.
 */
function buildSectionInstructions(): string {
  return `
أنت مساعد بحث أكاديمي متخصص في تحليل الوثائق التاريخية.

ستحلل جزءًا محددًا من كتاب أو رسالة أو وثيقة تاريخية، وليس المستند كله.

قواعد إلزامية:

1. اعتمد أولًا على النص الموجود في الجزء المرسل.
2. اكتب بالعربية الفصحى الواضحة والأسلوب الأكاديمي.
3. لا تنسب إلى هذا الجزء معلومة غير موجودة فيه.
4. لا تخترع اسم شخص أو مكان أو حدث أو علاقة.
5. استخرج الشخصيات حتى لو ظهرت بألقابها أو بصيغ مختصرة.
6. وحّد صياغة الاسم عندما تكون هوية الشخصية واضحة من النص.
7. لا تدمج شخصيتين مختلفتين لمجرد تشابه الأسماء.
8. استخرج الأماكن والمدن والأقاليم والدول والمواقع التاريخية.
9. استخرج الأحداث والوقائع والمعارك والتحولات التاريخية.
10. استخرج العلاقات المدعومة بالنص فقط.
11. اجعل relation وصفًا عربيًا مختصرًا ودقيقًا، مثل:
    - حكم
    - حارب
    - تحالف مع
    - تولى بعد
    - انتقل إلى
    - وقعت في
    - أسس
    - قاد
12. اكتب summary كملخص مركز لأهم مضمون الجزء.
13. اكتب analysis كتحليل أوسع يوضح:
    - الأفكار الرئيسية
    - السياق التاريخي
    - الأسباب
    - النتائج
    - تطور الأحداث
    - أدوار الشخصيات
    - العلاقات بين الوقائع
14. استخرج كلمات مفتاحية محددة ومفيدة للبحث.
15. تجنب الكلمات العامة جدًا مثل:
    "تاريخ" و"كتاب" و"دراسة" ما لم تكن جزءًا من مصطلح محدد.
16. إذا كان النص به أخطاء OCR، أصلح المعنى قدر الإمكان دون اختراع معلومات.
17. إذا كان اسم أو تاريخ غير واضح، لا تجزم به.
18. لا تضف إثراءً من معرفتك العامة داخل summary أو analysis.
19. لا تذكر أن النص جزء من مستند إلا عند الحاجة.
20. لا تستخدم Markdown داخل قيم JSON.
  `.trim();
}

/**
 * بناء مدخل واضح يتضمن نطاق الصفحات
 * ومحتوى الجزء.
 */
function buildSectionInput({
  documentName,
  sectionIndex,
  startPage,
  endPage,
  content,
}: {
  documentName: string;
  sectionIndex: number;
  startPage: number;
  endPage: number;
  content: string;
}): string {
  return `
اسم المستند:
${documentName}

رقم الجزء:
${sectionIndex + 1}

نطاق الصفحات:
من الصفحة ${startPage} إلى الصفحة ${endPage}

محتوى الجزء:

${content}
  `.trim();
}

/**
 * تحويل الخطأ إلى رسالة قابلة للحفظ.
 */
function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      2000
    );
  }

  return "حدث خطأ غير معروف أثناء تحليل قسم المستند.";
}

/**
 * تحليل قسم واحد محفوظ في قاعدة البيانات.
 */
export async function analyzeSection(
  sectionId: number
): Promise<AnalyzeSectionResult> {
  if (
    !Number.isInteger(sectionId) ||
    sectionId <= 0
  ) {
    throw new Error(
      "رقم قسم المستند غير صحيح."
    );
  }

  const section =
    await prisma.documentSection.findUnique({
      where: {
        id: sectionId,
      },

      select: {
        id: true,
        documentId: true,
        sectionIndex: true,
        startPage: true,
        endPage: true,
        content: true,
        processingStatus: true,

        document: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (!section) {
    throw new Error(
      "قسم المستند غير موجود."
    );
  }

  /*
   * لو القسم مكتمل بالفعل نعيد بياناته
   * بدل استهلاك OpenAI مرة أخرى.
   */
  if (
    section.processingStatus ===
    "COMPLETED"
  ) {
    const completedSection =
      await prisma.documentSection.findUniqueOrThrow({
        where: {
          id: section.id,
        },

        select: {
          summary: true,
          analysis: true,
          people: true,
          places: true,
          events: true,
          relations: true,
          keywords: true,
        },
      });

    return {
      sectionId: section.id,
      documentId:
        section.documentId,
      sectionIndex:
        section.sectionIndex,
      startPage:
        section.startPage,
      endPage:
        section.endPage,
      status: "COMPLETED",

      analysis: {
        summary:
          completedSection.summary ??
          "",

        analysis:
          completedSection.analysis ??
          "",

        people: parseStringArray(
          completedSection.people
        ),

        places: parseStringArray(
          completedSection.places
        ),

        events: parseStringArray(
          completedSection.events
        ),

        relations:
          parseRelations(
            completedSection.relations
          ),

        keywords: parseStringArray(
          completedSection.keywords
        ),
      },
    };
  }

  const cleanedContent =
    limitSectionContent(
      cleanSectionContent(
        section.content
      )
    );

  if (
    cleanedContent.length < 20
  ) {
    const message =
      "لا يحتوي هذا القسم على نص كافٍ للتحليل.";

    await prisma.documentSection.update({
      where: {
        id: section.id,
      },

      data: {
        processingStatus:
          "FAILED",
        processingError:
          message,
      },
    });

    await refreshSectionProgress(
      section.documentId
    );

    throw new Error(message);
  }

  await prisma.documentSection.update({
    where: {
      id: section.id,
    },

    data: {
      processingStatus:
        "PROCESSING",
      processingError:
        null,
    },
  });

  console.log(
    "========== ANALYZE DOCUMENT SECTION =========="
  );

  console.log(
    "Document ID:",
    section.documentId
  );

  console.log(
    "Section ID:",
    section.id
  );

  console.log(
    "Section Index:",
    section.sectionIndex
  );

  console.log(
    "Pages:",
    `${section.startPage}-${section.endPage}`
  );

  console.log(
    "Characters:",
    cleanedContent.length
  );

  try {
    const result =
      await runOpenAIStructured<SectionAnalysisResult>({
        operationName:
          `section_analysis_${section.id}`,

        instructions:
          buildSectionInstructions(),

        input:
          buildSectionInput({
            documentName:
              section.document.name,

            sectionIndex:
              section.sectionIndex,

            startPage:
              section.startPage,

            endPage:
              section.endPage,

            content:
              cleanedContent,
          }),

        schemaName:
          "history_section_analysis",

        schemaDescription:
          "تحليل أكاديمي منظم لجزء من مستند تاريخي.",

        schema:
          SECTION_ANALYSIS_SCHEMA,

        validate:
          validateSectionAnalysis,

        maxOutputTokens: 7000,

        reasoningEffort: "low",
      });

    await prisma.documentSection.update({
      where: {
        id: section.id,
      },

      data: {
        summary:
          result.summary,

        analysis:
          result.analysis,

        people:
          stringifyValue(
            result.people
          ),

        places:
          stringifyValue(
            result.places
          ),

        events:
          stringifyValue(
            result.events
          ),

        relations:
          stringifyValue(
            result.relations
          ),

        keywords:
          stringifyValue(
            result.keywords
          ),

        processingStatus:
          "COMPLETED",

        processingError:
          null,
      },
    });

    await refreshSectionProgress(
      section.documentId
    );

    console.log(
      "Section analysis completed:",
      section.id
    );

    console.log(
      "=============================================="
    );

    return {
      sectionId:
        section.id,

      documentId:
        section.documentId,

      sectionIndex:
        section.sectionIndex,

      startPage:
        section.startPage,

      endPage:
        section.endPage,

      status:
        "COMPLETED",

      analysis:
        result,
    };
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "SECTION ANALYSIS ERROR:",
      error
    );

    await prisma.documentSection.update({
      where: {
        id: section.id,
      },

      data: {
        processingStatus:
          "FAILED",

        processingError:
          message,
      },
    });

    await refreshSectionProgress(
      section.documentId
    );

    throw error;
  }
}

/**
 * تحليل عدد محدود من الأقسام المعلقة.
 *
 * الافتراضي قسم واحد في كل تشغيل،
 * لحماية الطلب من تجاوز maxDuration.
 */
export async function analyzePendingSections(
  documentId: number,
  options: AnalyzePendingSectionsOptions = {}
): Promise<AnalyzePendingSectionsResult> {
  if (
    !Number.isInteger(documentId) ||
    documentId <= 0
  ) {
    throw new Error(
      "رقم المستند غير صحيح عند تحليل الأقسام."
    );
  }

  const sectionsPerRun =
    Math.max(
      1,
      Math.min(
        3,
        Math.floor(
          options.sectionsPerRun ??
            DEFAULT_SECTIONS_PER_RUN
        )
      )
    );

  const document =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },

      select: {
        id: true,
        totalSections: true,
        sectionAnalysisStatus:
          true,
      },
    });

  if (!document) {
    throw new Error(
      "المستند غير موجود عند تحليل الأقسام."
    );
  }

  await markSectionAnalysisStarted(
    documentId
  );

  /*
   * نعيد الأقسام الفاشلة إلى PENDING
   * فقط عند الاستدعاء اليدوي لاحقًا؟
   *
   * حاليًا نحلل PENDING فقط حتى لا ندخل
   * في حلقة تكرار لا نهائية مع قسم فاشل.
   */
  const pendingSections =
    await prisma.documentSection.findMany({
      where: {
        documentId,
        processingStatus:
          "PENDING",
      },

      orderBy: {
        sectionIndex:
          "asc",
      },

      take:
        sectionsPerRun,

      select: {
        id: true,
      },
    });

  let analyzedSections = 0;

  try {
    for (
      const section of pendingSections
    ) {
      await analyzeSection(
        section.id
      );

      analyzedSections += 1;
    }

    const progress =
      await refreshSectionProgress(
        documentId
      );

    const remainingSections =
      Math.max(
        progress.totalSections -
          progress.processedSections,
        0
      );

    return {
      documentId,

      analyzedSections,

      remainingSections,

      processedSections:
        progress.processedSections,

      totalSections:
        progress.totalSections,

      sectionAnalysisStatus:
        progress.sectionAnalysisStatus,
    };
  } catch (error) {
    const message =
      getErrorMessage(error);

    await markSectionAnalysisFailed(
      documentId,
      message
    );

    throw error;
  }
}

/**
 * إعادة قسم فاشل إلى قائمة الانتظار.
 */
export async function retryFailedSection(
  sectionId: number
) {
  if (
    !Number.isInteger(sectionId) ||
    sectionId <= 0
  ) {
    throw new Error(
      "رقم قسم المستند غير صحيح."
    );
  }

  const section =
    await prisma.documentSection.update({
      where: {
        id: sectionId,
      },

      data: {
        processingStatus:
          "PENDING",

        processingError:
          null,
      },

      select: {
        id: true,
        documentId: true,
        sectionIndex: true,
        processingStatus: true,
      },
    });

  await prisma.document.update({
    where: {
      id: section.documentId,
    },

    data: {
      sectionAnalysisStatus:
        "PENDING",

      sectionAnalysisError:
        null,
    },
  });

  return section;
}

/**
 * قراءة JSON محفوظ بأمان.
 */
function parseStringArray(
  value: string | null
): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (
        item
      ): item is string =>
        typeof item ===
          "string" &&
        item.trim().length > 0
    );
  } catch {
    return [];
  }
}

function parseRelations(
  value: string | null
): SectionAnalysisResult["relations"] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (
          item
        ): item is {
          source: string;
          relation: string;
          target: string;
        } =>
          Boolean(item) &&
          typeof item ===
            "object" &&
          typeof (
            item as {
              source?: unknown;
            }
          ).source ===
            "string" &&
          typeof (
            item as {
              relation?: unknown;
            }
          ).relation ===
            "string" &&
          typeof (
            item as {
              target?: unknown;
            }
          ).target ===
            "string"
      )
      .map((item) => ({
        source:
          item.source.trim(),

        relation:
          item.relation.trim(),

        target:
          item.target.trim(),
      }))
      .filter(
        (item) =>
          Boolean(item.source) &&
          Boolean(item.relation) &&
          Boolean(item.target)
      );
  } catch {
    return [];
  }
}