export type DocumentSearchResult = {
  text: string;
  score: number;
  chunkIndex: number;
  page: number | null;
  matchedTerms: string[];
};

export type DocumentQuestionMode =
  | "analysis"
  | "extract"
  | "summary"
  | "search";

export type ParsedDocumentQuestion = {
  originalQuestion: string;
  searchQuery: string;
  mode: DocumentQuestionMode;
  startPage: number | null;
  endPage: number | null;
  hasPageRange: boolean;
};

type SearchDocumentOptions = {
  chunkSize?: number;
  overlap?: number;
  maxResults?: number;

  startPage?: number | null;
  endPage?: number | null;

  includeAllRangeChunks?: boolean;
  maxResultsPerPage?: number;
};

type DocumentPage = {
  page: number | null;
  text: string;
};

const COMMAND_WORDS = new Set([
  "حلل",
  "تحليل",
  "استخرج",
  "استخراج",
  "اعرض",
  "اظهر",
  "لخص",
  "تلخيص",
  "ابحث",
  "البحث",
  "اقرا",
  "اقرأ",
  "اذكر",
  "وضح",
  "اشرح",
  "ناقش",
  "المستند",
  "الملف",
  "الكتاب",
  "pdf",
  "الصفحه",
  "الصفحات",
  "صفحه",
  "صفحات",
  "من",
  "الي",
  "الى",
  "بين",
  "فقط",
  "كله",
  "كامل",
  "كاملا",
  "كاملة",
  "داخل",
  "في",
  "عن",
  "ما",
  "ماذا",
  "هو",
  "هي",
  "هل",
  "كيف",
  "متي",
  "اين",
  "لماذا",
]);

const SYNONYM_GROUPS: string[][] = [
  [
    "سبي",
    "سبايا",
    "سبيه",
    "سبيات",
    "اسيرات",
    "اسيره",
    "مأسورات",
    "ماسورات",
  ],
  [
    "اسر",
    "اسري",
    "اسير",
    "اسيره",
    "مأسور",
    "ماسور",
    "معتقل",
  ],
  [
    "حرب",
    "حروب",
    "قتال",
    "معركه",
    "معارك",
    "غزوه",
    "غزوات",
  ],
  [
    "بيع",
    "باع",
    "يباع",
    "اسواق",
    "سوق",
    "ثمن",
    "اثمان",
    "سعر",
    "اسعار",
  ],
  [
    "فداء",
    "فديه",
    "افتداء",
    "مفاداه",
    "اطلاق",
    "تحرير",
  ],
  [
    "معامله",
    "معاملة",
    "وضع",
    "احوال",
    "مصير",
    "رعايه",
  ],
  [
    "دور",
    "ادوار",
    "اثر",
    "تاثير",
    "اسهام",
    "مساهمه",
  ],
  [
    "اقتصادي",
    "اقتصاديه",
    "اقتصاد",
    "مالي",
    "ماليه",
    "تجاري",
    "تجاريه",
  ],
  [
    "اجتماعي",
    "اجتماعيه",
    "مجتمع",
    "زواج",
    "اسره",
    "اسري",
  ],
  [
    "حضاري",
    "حضاريه",
    "ثقافي",
    "ثقافيه",
    "علمي",
    "علميه",
  ],
];

export function normalizeSearchText(
  text: string
): string {
  return text
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function convertArabicDigits(
  value: string
): string {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return value
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    );
}

function detectQuestionMode(
  question: string
): DocumentQuestionMode {
  const normalized =
    normalizeSearchText(question);

  if (
    normalized.includes("استخرج") ||
    normalized.includes("اعرض") ||
    normalized.includes("اظهر")
  ) {
    return "extract";
  }

  if (
    normalized.includes("لخص") ||
    normalized.includes("تلخيص")
  ) {
    return "summary";
  }

  if (
    normalized.includes("حلل") ||
    normalized.includes("تحليل") ||
    normalized.includes("ناقش") ||
    normalized.includes("قارن") ||
    normalized.includes("تفسير")
  ) {
    return "analysis";
  }

  return "search";
}

function extractPageRange(
  question: string
): {
  startPage: number | null;
  endPage: number | null;
} {
  const converted =
    convertArabicDigits(question);

  const patterns = [
    /من\s+(?:صفحة|صفحه)\s*(\d+)\s+(?:إلى|الى|لـ|ل)\s*(?:صفحة|صفحه)?\s*(\d+)/i,

    /بين\s+(?:الصفحات?|صفحات?)?\s*(\d+)\s+(?:و|إلى|الى)\s*(\d+)/i,

    /(?:الصفحات?|صفحات?)\s*(\d+)\s*[-–—:]\s*(\d+)/i,

    /(?:من|بين)\s*(\d+)\s+(?:إلى|الى|و)\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = converted.match(pattern);

    if (!match) {
      continue;
    }

    const first = Number(match[1]);
    const second = Number(match[2]);

    if (
      Number.isInteger(first) &&
      Number.isInteger(second) &&
      first > 0 &&
      second > 0
    ) {
      return {
        startPage: Math.min(first, second),
        endPage: Math.max(first, second),
      };
    }
  }

  const singlePageMatch = converted.match(
    /(?:صفحة|صفحه)\s*(\d+)/i
  );

  if (singlePageMatch) {
    const page = Number(singlePageMatch[1]);

    if (
      Number.isInteger(page) &&
      page > 0
    ) {
      return {
        startPage: page,
        endPage: page,
      };
    }
  }

  return {
    startPage: null,
    endPage: null,
  };
}

function removePageInstructions(
  question: string
): string {
  const converted =
    convertArabicDigits(question);

  return converted
    .replace(
      /من\s+(?:صفحة|صفحه)\s*\d+\s+(?:إلى|الى|لـ|ل)\s*(?:صفحة|صفحه)?\s*\d+/gi,
      " "
    )
    .replace(
      /بين\s+(?:الصفحات?|صفحات?)?\s*\d+\s+(?:و|إلى|الى)\s*\d+/gi,
      " "
    )
    .replace(
      /(?:الصفحات?|صفحات?)\s*\d+\s*[-–—:]\s*\d+/gi,
      " "
    )
    .replace(
      /(?:من|بين)\s*\d+\s+(?:إلى|الى|و)\s*\d+/gi,
      " "
    )
    .replace(
      /(?:صفحة|صفحه)\s*\d+/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchQuery(
  question: string
): string {
  const withoutPages =
    removePageInstructions(question);

  const normalized =
    normalizeSearchText(withoutPages);

  const usefulWords = normalized
    .split(" ")
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length >= 2 &&
        !COMMAND_WORDS.has(word) &&
        !/^\d+$/.test(word)
    );

  return Array.from(
    new Set(usefulWords)
  ).join(" ");
}

export function parseDocumentQuestion(
  question: string
): ParsedDocumentQuestion {
  const pageRange =
    extractPageRange(question);

  return {
    originalQuestion: question,
    searchQuery: buildSearchQuery(question),
    mode: detectQuestionMode(question),
    startPage: pageRange.startPage,
    endPage: pageRange.endPage,
    hasPageRange:
      pageRange.startPage !== null ||
      pageRange.endPage !== null,
  };
}

function splitIntoWords(
  text: string
): string[] {
  return normalizeSearchText(text)
    .split(" ")
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length >= 2 &&
        !COMMAND_WORDS.has(word)
    );
}

function expandQueryWords(
  words: string[]
): string[] {
  const expanded = new Set(words);

  for (const word of words) {
    for (const group of SYNONYM_GROUPS) {
      if (group.includes(word)) {
        for (const synonym of group) {
          expanded.add(synonym);
        }
      }
    }
  }

  return Array.from(expanded);
}

function splitDocumentIntoPages(
  content: string
): DocumentPage[] {
  const pageMarkerPattern =
    /\[\[PAGE:(\d+)\]\]/g;

  const matches = Array.from(
    content.matchAll(pageMarkerPattern)
  );

  if (matches.length === 0) {
    return [
      {
        page: null,
        text: content.trim(),
      },
    ];
  }

  const pages: DocumentPage[] = [];

  for (
    let index = 0;
    index < matches.length;
    index++
  ) {
    const currentMatch = matches[index];
    const nextMatch = matches[index + 1];

    const pageNumber = Number(
      currentMatch[1]
    );

    const contentStart =
      (currentMatch.index ?? 0) +
      currentMatch[0].length;

    const contentEnd =
      nextMatch?.index ?? content.length;

    const pageText = content
      .slice(contentStart, contentEnd)
      .trim();

    if (
      !Number.isInteger(pageNumber)
    ) {
      continue;
    }

    pages.push({
      page: pageNumber,
      text: pageText,
    });
  }

  return pages;
}

function createChunks(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  const cleanText = text
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) {
    return [];
  }

  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleanText.length) {
    let end = Math.min(
      start + chunkSize,
      cleanText.length
    );

    if (end < cleanText.length) {
      const sentenceEnds = [
        cleanText.lastIndexOf(".", end),
        cleanText.lastIndexOf("،", end),
        cleanText.lastIndexOf("؛", end),
        cleanText.lastIndexOf("؟", end),
        cleanText.lastIndexOf("\n", end),
      ];

      const sentenceEnd =
        Math.max(...sentenceEnds);

      if (
        sentenceEnd >
        start + chunkSize * 0.6
      ) {
        end = sentenceEnd + 1;
      }
    }

    const chunk = cleanText
      .slice(start, end)
      .trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= cleanText.length) {
      break;
    }

    start = Math.max(
      end - overlap,
      start + 1
    );
  }

  return chunks;
}

function countOccurrences(
  text: string,
  word: string
): number {
  let position = 0;
  let count = 0;

  while (position < text.length) {
    const foundAt =
      text.indexOf(word, position);

    if (foundAt === -1) {
      break;
    }

    count += 1;
    position =
      foundAt + word.length;
  }

  return count;
}

function calculateChunkScore(
  chunk: string,
  query: string,
  originalWords: string[],
  expandedWords: string[]
): {
  score: number;
  matchedTerms: string[];
} {
  const normalizedChunk =
    normalizeSearchText(chunk);

  const normalizedQuery =
    normalizeSearchText(query);

  let score = 0;

  const matchedTerms =
    expandedWords.filter((word) =>
      normalizedChunk.includes(word)
    );

  if (
    normalizedQuery.length > 2 &&
    normalizedChunk.includes(
      normalizedQuery
    )
  ) {
    score += 45;
  }

  for (const word of originalWords) {
    const occurrences =
      countOccurrences(
        normalizedChunk,
        word
      );

    if (occurrences > 0) {
      score +=
        Math.min(occurrences, 5) * 8;
    }
  }

  for (const word of expandedWords) {
    if (originalWords.includes(word)) {
      continue;
    }

    const occurrences =
      countOccurrences(
        normalizedChunk,
        word
      );

    if (occurrences > 0) {
      score +=
        Math.min(occurrences, 4) * 3;
    }
  }

  const originalMatches =
    originalWords.filter((word) =>
      normalizedChunk.includes(word)
    ).length;

  if (originalMatches >= 2) {
    score +=
      originalMatches *
      originalMatches *
      5;
  }

  const coverage =
    originalWords.length > 0
      ? originalMatches /
        originalWords.length
      : 0;

  score += Math.round(coverage * 30);

  return {
    score,
    matchedTerms:
      Array.from(
        new Set(matchedTerms)
      ),
  };
}

function isPageInsideRange(
  page: number | null,
  startPage?: number | null,
  endPage?: number | null
): boolean {
  if (page === null) {
    return true;
  }

  if (
    startPage !== null &&
    startPage !== undefined &&
    page < startPage
  ) {
    return false;
  }

  if (
    endPage !== null &&
    endPage !== undefined &&
    page > endPage
  ) {
    return false;
  }

  return true;
}

function normalizeForDuplicateCheck(
  text: string
): string {
  return normalizeSearchText(text)
    .slice(0, 500);
}

function removeDuplicateResults(
  results: DocumentSearchResult[]
): DocumentSearchResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key =
      normalizeForDuplicateCheck(
        result.text
      );

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function selectDiverseResults(
  results: DocumentSearchResult[],
  maxResults: number,
  maxResultsPerPage: number
): DocumentSearchResult[] {
  const selected: DocumentSearchResult[] =
    [];

  const pageCounts = new Map<
    string,
    number
  >();

  for (const result of results) {
    const pageKey =
      result.page === null
        ? "unknown"
        : String(result.page);

    const count =
      pageCounts.get(pageKey) ?? 0;

    if (count >= maxResultsPerPage) {
      continue;
    }

    selected.push(result);

    pageCounts.set(
      pageKey,
      count + 1
    );

    if (
      selected.length >= maxResults
    ) {
      break;
    }
  }

  return selected;
}

export function searchDocument(
  content: string,
  query: string,
  options: SearchDocumentOptions = {}
): DocumentSearchResult[] {
  const {
    chunkSize = 1600,
    overlap = 250,
    maxResults = 30,
    startPage = null,
    endPage = null,
    includeAllRangeChunks = false,
    maxResultsPerPage = 2,
  } = options;

  if (!content?.trim()) {
    return [];
  }

  const originalWords = Array.from(
    new Set(splitIntoWords(query))
  );

  const expandedWords =
    expandQueryWords(originalWords);

  const pages =
    splitDocumentIntoPages(content)
      .filter((page) =>
        isPageInsideRange(
          page.page,
          startPage,
          endPage
        )
      );

  const results: DocumentSearchResult[] =
    [];

  let globalChunkIndex = 0;

  for (const page of pages) {
    const chunks = createChunks(
      page.text,
      chunkSize,
      overlap
    );

    for (const chunk of chunks) {
      if (
        includeAllRangeChunks &&
        originalWords.length === 0
      ) {
        results.push({
          text: chunk,
          score: 1,
          chunkIndex:
            globalChunkIndex,
          page: page.page,
          matchedTerms: [],
        });

        globalChunkIndex += 1;
        continue;
      }

      const calculated =
        calculateChunkScore(
          chunk,
          query,
          originalWords,
          expandedWords
        );

      if (calculated.score > 0) {
        results.push({
          text: chunk,
          score: calculated.score,
          chunkIndex:
            globalChunkIndex,
          page: page.page,
          matchedTerms:
            calculated.matchedTerms,
        });
      }

      globalChunkIndex += 1;
    }
  }

  const sortedResults =
    removeDuplicateResults(results)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        if (
          a.page !== null &&
          b.page !== null &&
          a.page !== b.page
        ) {
          return a.page - b.page;
        }

        return (
          a.chunkIndex -
          b.chunkIndex
        );
      });

  if (
    includeAllRangeChunks &&
    originalWords.length === 0
  ) {
    return sortedResults.slice(
      0,
      maxResults
    );
  }

  return selectDiverseResults(
    sortedResults,
    maxResults,
    maxResultsPerPage
  );
}