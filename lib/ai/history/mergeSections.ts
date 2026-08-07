import { prisma } from "@/lib/prisma";

import {
  runOpenAIStructured,
} from "@/lib/ai/core/openai";

import {
  SECTION_ANALYSIS_SCHEMA,
  validateSectionAnalysis,
  type SectionAnalysisResult,
  type SectionRelation,
} from "@/lib/ai/core/schemas";

import { saveEntities } from "@/lib/ai/saveEntities";

export type MergeDocumentSectionsResult = {
  documentId: number;
  projectId: number;
  totalSections: number;
  mergedBatches: number;
  summary: string;
  analysis: string;
  people: string[];
  places: string[];
  events: string[];
  relations: SectionRelation[];
  keywords: string[];
  status: "COMPLETED";
};

type StoredSection = {
  id: number;
  sectionIndex: number;
  startPage: number;
  endPage: number;
  summary: string;
  analysis: string;
  people: string[];
  places: string[];
  events: string[];
  relations: SectionRelation[];
  keywords: string[];
};

const MAX_MERGE_INPUT_CHARACTERS =
  12_000;

const MAX_MERGE_OUTPUT_TOKENS =
  12_000;

/**
 * تنظيف النصوص قبل إرسالها إلى OpenAI.
 */
function cleanText(
  value: string
): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * حذف التكرار من مصفوفة النصوص.
 */
function uniqueStrings(
  values: string[]
): string[] {
  const seen = new Set<string>();

  const result: string[] = [];

  for (const value of values) {
    const cleanValue =
      cleanText(value);

    if (!cleanValue) {
      continue;
    }

    const key =
      cleanValue.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(cleanValue);
  }

  return result;
}

/**
 * حذف العلاقات المكررة.
 */
function uniqueRelations(
  relations: SectionRelation[]
): SectionRelation[] {
  const seen = new Set<string>();

  const result: SectionRelation[] = [];

  for (const relation of relations) {
    const source =
      cleanText(relation.source);

    const relationText =
      cleanText(relation.relation);

    const target =
      cleanText(relation.target);

    if (
      !source ||
      !relationText ||
      !target
    ) {
      continue;
    }

    const key = [
      source,
      relationText,
      target,
    ]
      .join("|")
      .toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    result.push({
      source,
      relation: relationText,
      target,
    });
  }

  return result;
}

/**
 * قراءة مصفوفة نصوص محفوظة داخل حقل JSON.
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

    return uniqueStrings(
      parsed.filter(
        (
          item
        ): item is string =>
          typeof item === "string"
      )
    );
  } catch {
    return [];
  }
}

/**
 * قراءة العلاقات المحفوظة داخل JSON.
 */
function parseRelations(
  value: string | null
): SectionRelation[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const relations: SectionRelation[] =
      [];

    for (const item of parsed) {
      if (
        !item ||
        typeof item !== "object"
      ) {
        continue;
      }

      const candidate = item as {
        source?: unknown;
        relation?: unknown;
        target?: unknown;
      };

      if (
        typeof candidate.source !==
          "string" ||
        typeof candidate.relation !==
          "string" ||
        typeof candidate.target !==
          "string"
      ) {
        continue;
      }

      relations.push({
        source:
          candidate.source,

        relation:
          candidate.relation,

        target:
          candidate.target,
      });
    }

    return uniqueRelations(
      relations
    );
  } catch {
    return [];
  }
}

/**
 * تحويل سجل DocumentSection إلى شكل
 * مناسب لعملية الدمج.
 */
function normalizeStoredSection(
  section: {
    id: number;
    sectionIndex: number;
    startPage: number;
    endPage: number;
    summary: string | null;
    analysis: string | null;
    people: string | null;
    places: string | null;
    events: string | null;
    relations: string | null;
    keywords: string | null;
  }
): StoredSection {
  return {
    id: section.id,

    sectionIndex:
      section.sectionIndex,

    startPage:
      section.startPage,

    endPage:
      section.endPage,

    summary:
      cleanText(
        section.summary ?? ""
      ),

    analysis:
      cleanText(
        section.analysis ?? ""
      ),

    people:
      parseStringArray(
        section.people
      ),

    places:
      parseStringArray(
        section.places
      ),

    events:
      parseStringArray(
        section.events
      ),

    relations:
      parseRelations(
        section.relations
      ),

    keywords:
      parseStringArray(
        section.keywords
      ),
  };
}

/**
 * بناء تمثيل نصي لتحليل قسم واحد.
 */
function buildSectionDigest(
  section: StoredSection
): string {
  const people =
    section.people.length > 0
      ? section.people.join("، ")
      : "لا توجد شخصيات واضحة";

  const places =
    section.places.length > 0
      ? section.places.join("، ")
      : "لا توجد أماكن واضحة";

  const events =
    section.events.length > 0
      ? section.events.join("، ")
      : "لا توجد أحداث واضحة";

  const keywords =
    section.keywords.length > 0
      ? section.keywords.join("، ")
      : "لا توجد كلمات مفتاحية";

  const relations =
    section.relations.length > 0
      ? section.relations
          .map(
            (relation) =>
              `${relation.source} — ${relation.relation} — ${relation.target}`
          )
          .join("\n")
      : "لا توجد علاقات واضحة";

  return `
[[SECTION:${section.sectionIndex + 1}]]

نطاق الصفحات:
${section.startPage} - ${section.endPage}

ملخص القسم:
${section.summary}

تحليل القسم:
${section.analysis}

الشخصيات:
${people}

الأماكن:
${places}

الأحداث:
${events}

العلاقات:
${relations}

الكلمات المفتاحية:
${keywords}
  `.trim();
}

/**
 * تعليمات دمج تحليلات أقسام المستند.
 */
function buildMergeInstructions(): string {
  return `
أنت باحث أكاديمي متخصص في تحليل الرسائل والكتب والوثائق التاريخية.

ستستقبل تحليلات جميع أقسام مستند واحد. تمثل هذه الأقسام أجزاء المستند من بدايته إلى نهايته، ومهمتك إنشاء تقرير أكاديمي شامل يعبّر عن المستند كله، لا فقرة مختصرة.

قواعد المصداقية:

1. اعتمد فقط على تحليلات الأقسام المرسلة.
2. لا تضف معلومات تاريخية من معرفتك العامة.
3. لا تخترع أسماء أو تواريخ أو أحداثًا أو مناهج أو نتائج.
4. إذا لم يظهر عنصر بوضوح في الأقسام، اذكر أنه لم يتضح من المحتوى المتاح.
5. لا تنسب رأيًا إلى الباحث إلا إذا ظهر بوضوح في التحليلات.
6. لا تنقل فقرات طويلة حرفيًا.
7. صغ التقرير تحليليًا مع الحفاظ على المعنى.
8. اجمع الأفكار المتكررة بدل تكرارها.
9. حافظ على الاختلافات المهمة بين الفصول والأقسام.
10. ميّز بين ما عرضه المستند وما يمكن استنتاجه تحليليًا منه.
11. لا تستخدم معرفة خارجية لإكمال النقص.
12. وحّد صيغ أسماء الشخصيات عندما تكون الهوية واحدة بشكل مؤكد.
13. لا تدمج شخصيات أو أماكن متشابهة إذا لم تتأكد من أنها كيان واحد.

حقل summary:

اكتب فيه ملخصًا تنفيذيًا شاملًا من عدة فقرات، وليس فقرة قصيرة. يجب أن يوضح:

- موضوع المستند ومجاله التاريخي.
- الإطار الزمني والمكاني.
- القضية أو المشكلة المركزية.
- أبرز المحاور التي تناولها المستند.
- أهم الشخصيات والأحداث المؤثرة.
- أبرز النتائج العامة.
- القيمة العلمية للمحتوى كما تظهر من المستند.

اجعل الملخص التنفيذي متناسبًا مع حجم المستند، وفي المستندات الكبيرة لا يقل عادةً عن 700 كلمة ما دامت المادة المتاحة تسمح بذلك.

حقل analysis:

اكتب تقريرًا أكاديميًا مفصلًا ومنظمًا بالعناوين التالية، مع حذف أي عنوان لا تدعمه الأقسام:

أولًا: التعريف بالمستند وموضوعه

وضح موضوع المستند وحدوده الزمنية والمكانية والقضية المركزية التي يناقشها.

ثانيًا: بنية المستند ومحاوره الرئيسية

اعرض الموضوعات والفصول والمحاور الأساسية، وبين كيفية انتقال المحتوى بينها.

ثالثًا: أهداف الدراسة وأسئلتها

استخرج الأهداف أو الأسئلة البحثية إذا ظهرت بوضوح. لا تخترعها من عندك.

رابعًا: المنهج والمصادر

اشرح المنهج أو نوع المصادر المستخدمة إذا ورد ما يدعم ذلك. إذا لم يظهر المنهج بوضوح، اذكر ذلك صراحة.

خامسًا: السياق التاريخي العام

اعرض السياق التاريخي المستفاد من أقسام المستند، دون إضافة معلومات خارجية.

سادسًا: الموضوعات والقضايا المركزية

ناقش كل موضوع رئيسي في فقرة مستقلة، واربط بين ظهوره في أجزاء المستند المختلفة.

سابعًا: الشخصيات المحورية وأدوارها

لا تسرد جميع الأسماء. اختر الشخصيات الأكثر تأثيرًا في مضمون المستند، ووضح دور كل شخصية وصلتها بالأحداث والقضايا الأساسية.

ثامنًا: الأماكن والمجالات الجغرافية المحورية

اختر الأماكن الأكثر أهمية، واشرح وظيفتها داخل الأحداث والمناقشات التاريخية.

تاسعًا: الأحداث والتطورات التاريخية

اعرض الأحداث الأساسية وتسلسلها وأسبابها ونتائجها كما تظهر في الأقسام.

عاشرًا: العلاقات بين الشخصيات والأحداث

حلل العلاقات المهمة فقط، ووضح كيف أثرت الشخصيات أو المؤسسات أو القوى في تطور الأحداث.

الحادي عشر: التحولات والتطور عبر المستند

بين كيف تطورت القضية أو الشخصيات أو الأحداث بين بداية المستند ووسطه ونهايته.

الثاني عشر: أبرز النتائج والاستنتاجات

استخرج النتائج المدعومة بالمحتوى، واعرضها في نقاط واضحة ومرقمة. لا تختلق نتائج لا تظهر في الأقسام.

الثالث عشر: ملاحظات نقدية على المحتوى

اذكر التكرار أو الغموض أو التناقض أو نقص التوثيق فقط إذا كانت تحليلات الأقسام تدعم ذلك بوضوح. لا تحكم على الرسالة حكمًا عامًا بلا دليل.

الرابع عشر: الخلاصة التحليلية

اكتب خلاصة مركزة تربط موضوع المستند بمحاوره ونتائجه وقيمته البحثية.

قواعد الأسلوب:

- اكتب بالعربية الفصحى الأكاديمية.
- استخدم فقرات واضحة ومريحة للقراءة.
- حافظ على العناوين السابقة داخل analysis.
- افصل بين العناوين والفقرات بأسطر جديدة.
- لا تستخدم جداول.
- لا تستخدم علامات Markdown مثل # أو **.
- يمكن استخدام الترقيم العربي وعلامات النقط.
- لا تجعل التقرير قائمة أسماء أو كيانات.
- ركز على التفسير والربط والتحليل.
- اجعل طول التقرير متناسبًا مع حجم المادة.
- في المستندات الكبيرة، يجب أن يكون analysis تقريرًا موسعًا لا فقرة عامة.
- لا تكرر summary حرفيًا داخل analysis.

قواعد استخراج البيانات المنظمة:

- people: اجمع الشخصيات المهمة مع حذف التكرار.
- places: اجمع الأماكن المهمة مع حذف التكرار.
- events: اجمع الأحداث الأساسية بصياغة واضحة.
- relations: احتفظ بالعلاقات المدعومة بوضوح فقط.
- keywords: اختر المصطلحات الأكثر تعبيرًا عن موضوع المستند.
  `.trim();
}

/**
 * تقسيم تمثيلات الأقسام إلى دفعات
 * مناسبة لسعة الإدخال.
 */
function groupDigestsIntoBatches(
  digests: string[],
  maxCharacters =
    MAX_MERGE_INPUT_CHARACTERS
): string[][] {
  const batches: string[][] = [];

  let currentBatch: string[] = [];
  let currentCharacters = 0;

  for (const digest of digests) {
    const digestLength =
      digest.length;

    const exceedsLimit =
      currentBatch.length > 0 &&
      currentCharacters +
        digestLength >
        maxCharacters;

    if (exceedsLimit) {
      batches.push(
        currentBatch
      );

      currentBatch = [];
      currentCharacters = 0;
    }

    currentBatch.push(digest);

    currentCharacters +=
      digestLength;
  }

  if (currentBatch.length > 0) {
    batches.push(
      currentBatch
    );
  }

  return batches;
}

/**
 * دمج دفعة واحدة من تحليلات الأقسام.
 */
async function mergeAnalysisBatch({
  documentName,
  batchIndex,
  totalBatches,
  digests,
}: {
  documentName: string;
  batchIndex: number;
  totalBatches: number;
  digests: string[];
}): Promise<SectionAnalysisResult> {
  const input = `
اسم المستند:
${documentName}

دفعة الدمج:
${batchIndex + 1} من ${totalBatches}

تحليلات الأقسام المطلوب دمجها:

${digests.join("\n\n==============================\n\n")}
  `.trim();

  return runOpenAIStructured<SectionAnalysisResult>({
    operationName:
      `merge_sections_batch_${batchIndex + 1}`,

    instructions:
      buildMergeInstructions(),

    input,

    schemaName:
      "merged_history_sections",

    schemaDescription:
      "تحليل أكاديمي موحد لعدة أقسام من مستند تاريخي.",

    schema:
      SECTION_ANALYSIS_SCHEMA,

    validate:
      validateSectionAnalysis,

    maxOutputTokens:
      MAX_MERGE_OUTPUT_TOKENS,

    reasoningEffort:
  "low",

  });
}

/**
 * تحويل نتيجة دمج مرحلية إلى Digest
 * يمكن استخدامه في مرحلة دمج أخرى.
 */
function buildMergedResultDigest(
  result: SectionAnalysisResult,
  index: number
): string {
  const relations =
    result.relations.length > 0
      ? result.relations
          .map(
            (relation) =>
              `${relation.source} — ${relation.relation} — ${relation.target}`
          )
          .join("\n")
      : "لا توجد علاقات واضحة";

  return `
[[MERGED_RESULT:${index + 1}]]

الملخص:
${result.summary}

التحليل:
${result.analysis}

الشخصيات:
${result.people.join("، ")}

الأماكن:
${result.places.join("، ")}

الأحداث:
${result.events.join("، ")}

العلاقات:
${relations}

الكلمات المفتاحية:
${result.keywords.join("، ")}
  `.trim();
}

/**
 * دمج النتائج المرحلية بصورة متكررة
 * حتى نحصل على تحليل نهائي واحد.
 */
async function mergeRecursively({
  documentName,
  initialDigests,
}: {
  documentName: string;
  initialDigests: string[];
}): Promise<{
  result: SectionAnalysisResult;
  mergedBatches: number;
}> {
  let currentDigests =
    initialDigests;

  let totalMergedBatches = 0;
  let mergeRound = 1;

  while (true) {
    const batches =
      groupDigestsIntoBatches(
        currentDigests
      );

    console.log(
      "========== MERGE SECTIONS ROUND =========="
    );

    console.log(
      "Round:",
      mergeRound
    );

    console.log(
      "Input Digests:",
      currentDigests.length
    );

    console.log(
      "Batches:",
      batches.length
    );

    console.log(
      "=========================================="
    );

    const roundResults:
      SectionAnalysisResult[] = [];

    for (
      let batchIndex = 0;
      batchIndex <
      batches.length;
      batchIndex++
    ) {
      const batchResult =
        await mergeAnalysisBatch({
          documentName,

          batchIndex,

          totalBatches:
            batches.length,

          digests:
            batches[batchIndex],
        });

      roundResults.push(
        batchResult
      );

      totalMergedBatches += 1;
    }

    if (
      roundResults.length === 1
    ) {
      return {
        result:
          roundResults[0],

        mergedBatches:
          totalMergedBatches,
      };
    }

    currentDigests =
      roundResults.map(
        (
          result,
          index
        ) =>
          buildMergedResultDigest(
            result,
            index
          )
      );

    mergeRound += 1;

    /*
     * حماية من الدخول في حلقة غير متوقعة.
     */
    if (mergeRound > 10) {
      throw new Error(
        "تعذر إنهاء دمج أقسام المستند بعد عدة مراحل."
      );
    }
  }
}

/**
 * تحويل نتيجة الدمج إلى نفس البنية
 * المستخدمة في saveEntities.
 */
function buildEntityAnalysis(
  result: SectionAnalysisResult
) {
  return {
    summary:
      result.summary,

    people:
      result.people,

    places:
      result.places,

    events:
      result.events,

    relations:
      result.relations,
  };
}

/**
 * دمج جميع الأقسام المكتملة
 * وحفظ التحليل النهائي للمستند والمشروع.
 */
export async function mergeDocumentSections(
  documentId: number
): Promise<MergeDocumentSectionsResult> {
  if (
    !Number.isInteger(documentId) ||
    documentId <= 0
  ) {
    throw new Error(
      "رقم المستند غير صحيح عند دمج الأقسام."
    );
  }

  const document =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },

      select: {
        id: true,
        name: true,
        projectId: true,
        totalSections: true,
        processedSections: true,
        sectionAnalysisStatus:
          true,

        sections: {
          orderBy: {
            sectionIndex:
              "asc",
          },

          select: {
            id: true,
            sectionIndex: true,
            startPage: true,
            endPage: true,
            summary: true,
            analysis: true,
            people: true,
            places: true,
            events: true,
            relations: true,
            keywords: true,
            processingStatus:
              true,
          },
        },
      },
    });

  if (!document) {
    throw new Error(
      "المستند غير موجود عند دمج الأقسام."
    );
  }

  if (
    document.sections.length === 0
  ) {
    throw new Error(
      "لا توجد أقسام محفوظة لهذا المستند."
    );
  }

  const failedSections =
    document.sections.filter(
      (section) =>
        section.processingStatus ===
        "FAILED"
    );

  if (
    failedSections.length > 0
  ) {
    throw new Error(
      `لا يمكن دمج المستند لأن ${failedSections.length} من أقسامه فشل تحليلها.`
    );
  }

  const incompleteSections =
    document.sections.filter(
      (section) =>
        section.processingStatus !==
        "COMPLETED"
    );

  if (
    incompleteSections.length > 0
  ) {
    throw new Error(
      `لم يكتمل تحليل ${incompleteSections.length} من أقسام المستند بعد.`
    );
  }

  const normalizedSections =
    document.sections.map(
      normalizeStoredSection
    );

  const validSections =
    normalizedSections.filter(
      (section) =>
        Boolean(
          section.summary ||
          section.analysis
        )
    );

  if (
    validSections.length === 0
  ) {
    throw new Error(
      "لا تحتوي أقسام المستند على تحليلات صالحة للدمج."
    );
  }

  await prisma.document.update({
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

  console.log(
    "========== MERGE DOCUMENT SECTIONS =========="
  );

  console.log(
    "Document ID:",
    document.id
  );

  console.log(
    "Document Name:",
    document.name
  );

  console.log(
    "Sections:",
    validSections.length
  );

  try {
    const initialDigests =
      validSections.map(
        buildSectionDigest
      );

    const merged =
      await mergeRecursively({
        documentName:
          document.name,

        initialDigests,
      });

    const finalResult: SectionAnalysisResult =
      {
        summary:
          cleanText(
            merged.result.summary
          ),

        analysis:
          cleanText(
            merged.result.analysis
          ),

        people:
          uniqueStrings(
            merged.result.people
          ),

        places:
          uniqueStrings(
            merged.result.places
          ),

        events:
          uniqueStrings(
            merged.result.events
          ),

        relations:
          uniqueRelations(
            merged.result.relations
          ),

        keywords:
          uniqueStrings(
            merged.result.keywords
          ),
      };

    const entityAnalysis =
      buildEntityAnalysis(
        finalResult
      );

    /*
     * حفظ الكيانات والعلاقات النهائية
     * للمستند كله داخل المشروع.
     */
    await saveEntities(
      document.projectId,
      entityAnalysis
    );

    await prisma.$transaction([
      prisma.document.update({
        where: {
          id: document.id,
        },

        data: {
          summary:
  finalResult.analysis,

          entities:
            JSON.stringify(
              finalResult
            ),

          sectionAnalysisStatus:
            "COMPLETED",

          processedSections:
            validSections.length,

          totalSections:
            document.sections.length,

          sectionAnalysisError:
            null,
        },
      }),

      prisma.project.update({
        where: {
          id: document.projectId,
        },

        data: {
          summary:
  finalResult.analysis,
        },
      }),
    ]);

    console.log(
      "Merged Sections:",
      validSections.length
    );

    console.log(
      "Merged Batches:",
      merged.mergedBatches
    );

    console.log(
      "People:",
      finalResult.people.length
    );

    console.log(
      "Places:",
      finalResult.places.length
    );

    console.log(
      "Events:",
      finalResult.events.length
    );

    console.log(
      "Relations:",
      finalResult.relations.length
    );

    console.log(
      "========== MERGE COMPLETED =========="
    );

    return {
      documentId:
        document.id,

      projectId:
        document.projectId,

      totalSections:
        validSections.length,

      mergedBatches:
        merged.mergedBatches,

      summary:
        finalResult.summary,

      analysis:
        finalResult.analysis,

      people:
        finalResult.people,

      places:
        finalResult.places,

      events:
        finalResult.events,

      relations:
        finalResult.relations,

      keywords:
        finalResult.keywords,

      status:
        "COMPLETED",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ أثناء دمج أقسام المستند.";

    console.error(
      "MERGE DOCUMENT SECTIONS ERROR:",
      error
    );

    await prisma.document.update({
      where: {
        id: documentId,
      },

      data: {
        sectionAnalysisStatus:
          "FAILED",

        sectionAnalysisError:
          message.slice(
            0,
            2000
          ),
      },
    });

    throw error;
  }
}