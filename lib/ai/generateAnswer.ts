import {
  DocumentQuestionMode,
  DocumentSearchResult,
  ParsedDocumentQuestion,
  normalizeSearchText,
} from "./searchDocument";

export type GeneratedAnswer = {
  answer: string;
  quote: string;
  page: number | null;
  pages: number[];
  confidence: number;
  evidenceCount: number;
  mode: DocumentQuestionMode;
};

type SentenceEvidence = {
  sentence: string;
  page: number | null;
  score: number;
  sourceScore: number;
  originalIndex: number;
};

const IGNORED_WORDS = new Set([
  "ما",
  "ماذا",
  "من",
  "هو",
  "هي",
  "هل",
  "كيف",
  "متي",
  "اين",
  "لماذا",
  "في",
  "على",
  "عن",
  "الى",
  "كان",
  "كانت",
  "الذي",
  "التي",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "حلل",
  "تحليل",
  "استخرج",
  "اعرض",
  "اظهر",
  "لخص",
  "تلخيص",
  "ابحث",
  "المستند",
  "الملف",
  "صفحه",
  "الصفحات",
]);

function splitSentences(
  text: string
): string[] {
  return text
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!؟؛])\s+/)
    .map((sentence) =>
      sentence.trim()
    )
    .filter(
      (sentence) =>
        sentence.length >= 30
    );
}

function getQuestionWords(
  question: string
): string[] {
  return Array.from(
    new Set(
      normalizeSearchText(question)
        .split(" ")
        .filter(
          (word) =>
            word.length > 2 &&
            !IGNORED_WORDS.has(word) &&
            !/^\d+$/.test(word)
        )
    )
  );
}

function countOccurrences(
  text: string,
  word: string
): number {
  if (!text || !word) {
    return 0;
  }

  return text
    .split(" ")
    .filter(
      (item) => item === word
    )
    .length;
}

function sentenceScore(
  sentence: string,
  question: string,
  sourceScore: number
): number {
  const normalizedSentence =
    normalizeSearchText(sentence);

  const normalizedQuestion =
    normalizeSearchText(question);

  const questionWords =
    getQuestionWords(question);

  let score = Math.min(
    sourceScore,
    100
  );

  if (
    normalizedQuestion &&
    normalizedSentence.includes(
      normalizedQuestion
    )
  ) {
    score += 80;
  }

  let matchedWords = 0;

  for (const word of questionWords) {
    const occurrences =
      countOccurrences(
        normalizedSentence,
        word
      );

    if (occurrences > 0) {
      matchedWords += 1;
      score +=
        Math.min(
          occurrences,
          4
        ) * 12;
    }
  }

  if (matchedWords >= 2) {
    score +=
      matchedWords *
      matchedWords *
      5;
  }

  if (
    sentence.length >= 60 &&
    sentence.length <= 600
  ) {
    score += 8;
  }

  if (
    /\d/.test(sentence)
  ) {
    score += 3;
  }

  return score;
}

function buildEvidence(
  question: string,
  results: DocumentSearchResult[]
): SentenceEvidence[] {
  const evidence: SentenceEvidence[] =
    [];

  let originalIndex = 0;

  for (const result of results) {
    const sentences =
      splitSentences(result.text);

    for (const sentence of sentences) {
      evidence.push({
        sentence,
        page: result.page,
        score: sentenceScore(
          sentence,
          question,
          result.score
        ),
        sourceScore:
          result.score,
        originalIndex,
      });

      originalIndex += 1;
    }
  }

  return evidence;
}

function removeDuplicateEvidence(
  evidence: SentenceEvidence[]
): SentenceEvidence[] {
  const seen = new Set<string>();

  return evidence.filter((item) => {
    const normalized =
      normalizeSearchText(
        item.sentence
      );

    const key =
      normalized.slice(0, 350);

    if (
      !key ||
      seen.has(key)
    ) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function selectEvidenceFromDifferentPages(
  evidence: SentenceEvidence[],
  maxEvidence: number
): SentenceEvidence[] {
  const sorted = [...evidence].sort(
    (a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        a.originalIndex -
        b.originalIndex
      );
    }
  );

  const selected: SentenceEvidence[] =
    [];

  const pageCounts = new Map<
    string,
    number
  >();

  for (const item of sorted) {
    const key =
      item.page === null
        ? "unknown"
        : String(item.page);

    const pageCount =
      pageCounts.get(key) ?? 0;

    if (pageCount >= 2) {
      continue;
    }

    selected.push(item);

    pageCounts.set(
      key,
      pageCount + 1
    );

    if (
      selected.length >= maxEvidence
    ) {
      break;
    }
  }

  return selected;
}

function cleanSentenceForAnswer(
  sentence: string,
  maxLength = 500
): string {
  const clean = sentence
    .replace(/\s+/g, " ")
    .trim();

  if (
    clean.length <= maxLength
  ) {
    return clean;
  }

  return `${clean
    .slice(0, maxLength)
    .trim()}...`;
}

function getUniquePages(
  evidence: SentenceEvidence[]
): number[] {
  return Array.from(
    new Set(
      evidence
        .map((item) => item.page)
        .filter(
          (
            page
          ): page is number =>
            typeof page === "number"
        )
    )
  ).sort((a, b) => a - b);
}

function pageLabel(
  page: number | null
): string {
  return page === null
    ? "صفحة غير محددة"
    : `صفحة ${page}`;
}

function buildExtractAnswer(
  evidence: SentenceEvidence[],
  parsed: ParsedDocumentQuestion
): string {
  if (evidence.length === 0) {
    return "لم يتم العثور على نصوص واضحة مطابقة لطلب الاستخراج داخل الصفحات المحددة.";
  }

  const lines = evidence.map(
    (item, index) =>
      `${index + 1}. ${cleanSentenceForAnswer(
        item.sentence,
        700
      )}\nالمصدر: ${pageLabel(
        item.page
      )}`
  );

  const rangeText =
    parsed.hasPageRange
      ? ` داخل النطاق من صفحة ${
          parsed.startPage ??
          "البداية"
        } إلى صفحة ${
          parsed.endPage ??
          "النهاية"
        }`
      : "";

  return [
    `تم استخراج النصوص الأكثر ارتباطًا بالطلب${rangeText}:`,
    "",
    ...lines,
  ].join("\n\n");
}

function buildSummaryAnswer(
  evidence: SentenceEvidence[],
  pages: number[],
  parsed: ParsedDocumentQuestion
): string {
  if (evidence.length === 0) {
    return "لم تتوافر معلومات كافية لتكوين ملخص واضح من الصفحات المحددة.";
  }

  const points = evidence
    .slice(0, 8)
    .map(
      (item) =>
        `• ${cleanSentenceForAnswer(
          item.sentence,
          380
        )} (${pageLabel(
          item.page
        )})`
    );

  const pageText =
    pages.length > 0
      ? pages.join("، ")
      : "غير محددة";

  return [
    parsed.hasPageRange
      ? `ملخص الصفحات من ${
          parsed.startPage
        } إلى ${
          parsed.endPage
        }:`
      : "ملخص المعلومات المرتبطة بالسؤال:",
    "",
    ...points,
    "",
    `الصفحات المستخدمة: ${pageText}`,
  ].join("\n");
}

function buildAnalysisAnswer(
  evidence: SentenceEvidence[],
  pages: number[],
  question: string
): string {
  if (evidence.length === 0) {
    return "لم تتوافر أدلة كافية داخل المستند لتقديم تحليل موثوق لهذا السؤال.";
  }

  const primaryEvidence =
    evidence.slice(0, 3);

  const supportingEvidence =
    evidence.slice(3, 7);

  const firstPage =
    primaryEvidence[0]?.page ??
    null;

  const opening = [
    "بعد مراجعة المواضع المرتبطة بالسؤال في الصفحات المختلفة،",
    `يتضح أن موضوع «${question}» ورد في أكثر من سياق داخل المستند،`,
    "ولا يمكن اختزاله في فقرة واحدة فقط.",
  ].join(" ");

  const centralFindings =
    primaryEvidence.map(
      (item, index) =>
        `${
          index + 1
        }. تشير المعلومات الواردة في ${pageLabel(
          item.page
        )} إلى أن ${cleanSentenceForAnswer(
          item.sentence,
          430
        )}`
    );

  const supportingFindings =
    supportingEvidence.map(
      (item) =>
        `• ويؤيد ذلك ما ورد في ${pageLabel(
          item.page
        )}: ${cleanSentenceForAnswer(
          item.sentence,
          360
        )}`
    );

  const pageText =
    pages.length > 0
      ? pages.join("، ")
      : firstPage !== null
        ? String(firstPage)
        : "غير محددة";

  return [
    "التحليل:",
    "",
    opening,
    "",
    "أهم النتائج:",
    ...centralFindings,
    supportingFindings.length > 0
      ? "\nأدلة داعمة:"
      : "",
    ...supportingFindings,
    "",
    "الاستنتاج:",
    "تُظهر الأدلة الموزعة على صفحات متعددة أن الإجابة تحتاج إلى الجمع بين أكثر من موضع داخل المستند، ولذلك بُني هذا التحليل على مجموعة من الشواهد المتنوعة وليس على أقرب فقرة متشابهة فقط.",
    "",
    `الصفحات المستخدمة: ${pageText}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSearchAnswer(
  evidence: SentenceEvidence[],
  pages: number[]
): string {
  if (evidence.length === 0) {
    return "لم يتم العثور على إجابة واضحة مرتبطة بالسؤال داخل المستند.";
  }

  const points = evidence
    .slice(0, 6)
    .map(
      (item) =>
        `• ${cleanSentenceForAnswer(
          item.sentence,
          430
        )} (${pageLabel(
          item.page
        )})`
    );

  const pageText =
    pages.length > 0
      ? pages.join("، ")
      : "غير محددة";

  return [
    "تم العثور على المعلومات التالية:",
    "",
    ...points,
    "",
    `الصفحات المستخدمة: ${pageText}`,
  ].join("\n");
}

function calculateConfidence(
  evidence: SentenceEvidence[],
  results: DocumentSearchResult[],
  pages: number[]
): number {
  if (
    evidence.length === 0 ||
    results.length === 0
  ) {
    return 0;
  }

  const topScore =
    Math.min(
      results[0].score,
      100
    );

  const evidenceScore =
    Math.min(
      evidence.length * 8,
      35
    );

  const pageDiversityScore =
    Math.min(
      pages.length * 5,
      25
    );

  return Math.min(
    100,
    Math.max(
      1,
      Math.round(
        topScore * 0.4 +
          evidenceScore +
          pageDiversityScore
      )
    )
  );
}

export function generateAnswer(
  question: string,
  results: DocumentSearchResult[],
  parsedQuestion?: ParsedDocumentQuestion
): GeneratedAnswer {
  const parsed =
    parsedQuestion ?? {
      originalQuestion: question,
      searchQuery: question,
      mode: "search" as const,
      startPage: null,
      endPage: null,
      hasPageRange: false,
    };

  if (results.length === 0) {
    return {
      answer:
        "لم يتم العثور على معلومات واضحة مرتبطة بالسؤال داخل المستند.",
      quote: "",
      page: null,
      pages: [],
      confidence: 0,
      evidenceCount: 0,
      mode: parsed.mode,
    };
  }

  const allEvidence =
  removeDuplicateEvidence(
    buildEvidence(
      parsed.searchQuery || question,
      results
    )
  );

const evidence =
  selectEvidenceFromDifferentPages(
    allEvidence,
    parsed.mode === "extract"
      ? 150
      : 80
  );

  const pages =
    getUniquePages(evidence);

  let answer: string;

  switch (parsed.mode) {
    case "extract":
      answer = buildExtractAnswer(
        evidence,
        parsed
      );
      break;

    case "summary":
      answer = buildSummaryAnswer(
        evidence,
        pages,
        parsed
      );
      break;

    case "analysis":
      answer = buildAnalysisAnswer(
        evidence,
        pages,
        parsed.searchQuery ||
          question
      );
      break;

    default:
      answer = buildSearchAnswer(
        evidence,
        pages
      );
      break;
  }

  const firstEvidence =
    evidence[0];

  const bestResult =
    results[0];

  return {
    answer,
    quote:
      firstEvidence?.sentence ??
      bestResult.text,
    page:
      firstEvidence?.page ??
      bestResult.page,
    pages,
    confidence:
      calculateConfidence(
        evidence,
        results,
        pages
      ),
    evidenceCount:
      evidence.length,
    mode: parsed.mode,
  };
}