export type DocumentSearchResult = {
  text: string;
  score: number;
  chunkIndex: number;
  page: number | null;
};

type SearchDocumentOptions = {
  chunkSize?: number;
  overlap?: number;
  maxResults?: number;
};

type DocumentPage = {
  page: number | null;
  text: string;
};

function normalizeSearchText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitIntoWords(text: string): string[] {
  return normalizeSearchText(text)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
}

function splitDocumentIntoPages(
  content: string
): DocumentPage[] {
  const pageMarkerPattern = /\[\[PAGE:(\d+)\]\]/g;
  const matches = Array.from(
    content.matchAll(pageMarkerPattern)
  );

  // دعم المستندات القديمة التي لا تحتوي على علامات صفحات
  if (matches.length === 0) {
    return [
      {
        page: null,
        text: content.trim(),
      },
    ];
  }

  const pages: DocumentPage[] = [];

  for (let index = 0; index < matches.length; index++) {
    const currentMatch = matches[index];
    const nextMatch = matches[index + 1];

    const pageNumber = Number(currentMatch[1]);

    const contentStart =
      (currentMatch.index ?? 0) + currentMatch[0].length;

    const contentEnd =
      nextMatch?.index ?? content.length;

    const pageText = content
      .slice(contentStart, contentEnd)
      .trim();

    if (!Number.isInteger(pageNumber)) {
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
      const lastFullStop =
        cleanText.lastIndexOf(".", end);

      const lastArabicComma =
        cleanText.lastIndexOf("،", end);

      const lastQuestionMark =
        cleanText.lastIndexOf("؟", end);

      const lastNewLine =
        cleanText.lastIndexOf("\n", end);

      const sentenceEnd = Math.max(
        lastFullStop,
        lastArabicComma,
        lastQuestionMark,
        lastNewLine
      );

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

function calculateChunkScore(
  chunk: string,
  query: string,
  queryWords: string[]
): number {
  const normalizedChunk =
    normalizeSearchText(chunk);

  const normalizedQuery =
    normalizeSearchText(query);

  let score = 0;

  // تطابق السؤال كاملًا
  if (
    normalizedQuery.length > 2 &&
    normalizedChunk.includes(normalizedQuery)
  ) {
    score += 20;
  }

  // حساب مرات ظهور كلمات السؤال
  for (const word of queryWords) {
    let searchPosition = 0;
    let occurrences = 0;

    while (
      searchPosition < normalizedChunk.length
    ) {
      const foundAt =
        normalizedChunk.indexOf(
          word,
          searchPosition
        );

      if (foundAt === -1) {
        break;
      }

      occurrences += 1;

      searchPosition =
        foundAt + word.length;
    }

    if (occurrences > 0) {
      score +=
        Math.min(occurrences, 5) * 3;
    }
  }

  // مكافأة للمقطع الذي يحتوي على أكثر من كلمة من كلمات السؤال
  const matchedWords =
    queryWords.filter((word) =>
      normalizedChunk.includes(word)
    );

  score +=
    matchedWords.length *
    matchedWords.length;

  return score;
}

export function searchDocument(
  content: string,
  query: string,
  options: SearchDocumentOptions = {}
): DocumentSearchResult[] {
  const {
    chunkSize = 1800,
    overlap = 300,
    maxResults = 6,
  } = options;

  if (
    !content?.trim() ||
    !query?.trim()
  ) {
    return [];
  }

  const queryWords = Array.from(
    new Set(splitIntoWords(query))
  );

  if (queryWords.length === 0) {
    return [];
  }

  const pages =
    splitDocumentIntoPages(content);

  const results: DocumentSearchResult[] = [];

  let globalChunkIndex = 0;

  for (const page of pages) {
    const chunks = createChunks(
      page.text,
      chunkSize,
      overlap
    );

    for (const chunk of chunks) {
      const score =
        calculateChunkScore(
          chunk,
          query,
          queryWords
        );

      if (score > 0) {
        results.push({
          text: chunk,
          score,
          chunkIndex: globalChunkIndex,
          page: page.page,
        });
      }

      globalChunkIndex += 1;
    }
  }

  return results
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.chunkIndex - b.chunkIndex;
    })
    .slice(0, maxResults);
}