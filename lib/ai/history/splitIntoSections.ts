export type DocumentPageSection = {
  sectionIndex: number;
  startPage: number;
  endPage: number;
  content: string;
  pageCount: number;
  characterCount: number;
};

type ParsedPage = {
  pageNumber: number;
  content: string;
};

export type SplitIntoSectionsOptions = {
  pagesPerSection?: number;
  maxCharactersPerSection?: number;
};

const DEFAULT_PAGES_PER_SECTION = 10;
const DEFAULT_MAX_CHARACTERS_PER_SECTION = 45_000;

const PAGE_MARKER_PATTERN =
  /\[\[PAGE:(\d+)\]\]/g;

/**
 * يحوّل محتوى المستند الذي يحتوي على علامات الصفحات:
 *
 * [[PAGE:1]]
 * نص الصفحة الأولى
 *
 * [[PAGE:2]]
 * نص الصفحة الثانية
 *
 * إلى مصفوفة صفحات منظمة.
 */
function parseDocumentPages(
  content: string
): ParsedPage[] {
  const cleanContent = content.trim();

  if (!cleanContent) {
    return [];
  }

  const matches = Array.from(
    cleanContent.matchAll(
      PAGE_MARKER_PATTERN
    )
  );

  /*
   * ملفات Word وبعض المستندات القديمة
   * قد لا تحتوي على علامات صفحات.
   * نتعامل معها كمستند من صفحة واحدة.
   */
  if (matches.length === 0) {
    return [
      {
        pageNumber: 1,
        content: cleanContent,
      },
    ];
  }

  const pages: ParsedPage[] = [];

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

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber <= 0
    ) {
      continue;
    }

    const contentStart =
      (currentMatch.index ?? 0) +
      currentMatch[0].length;

    const contentEnd =
      nextMatch?.index ??
      cleanContent.length;

    const pageContent = cleanContent
      .slice(
        contentStart,
        contentEnd
      )
      .replace(/\u0000/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    pages.push({
      pageNumber,
      content: pageContent,
    });
  }

  return pages;
}

/**
 * يبني نص القسم مع الاحتفاظ بعلامات الصفحات،
 * حتى نستطيع لاحقًا إظهار صفحات الأدلة.
 */
function buildSectionContent(
  pages: ParsedPage[]
): string {
  return pages
    .map((page) => {
      return [
        `[[PAGE:${page.pageNumber}]]`,
        page.content,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n")
    .trim();
}

/**
 * تقسيم المستند إلى أقسام متوازنة.
 *
 * القاعدة الأساسية:
 * - كل قسم يحتوي افتراضيًا على 10 صفحات.
 * - إذا وصل القسم إلى الحد الأقصى من الحروف
 *   يتم إغلاقه قبل اكتمال 10 صفحات.
 *
 * هذا يمنع إرسال جزء ضخم جدًا إلى OpenAI.
 */
export function splitIntoSections(
  content: string,
  options: SplitIntoSectionsOptions = {}
): DocumentPageSection[] {
  const pagesPerSection =
    Math.max(
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

  const pages =
    parseDocumentPages(content);

  if (pages.length === 0) {
    return [];
  }

  const sections: DocumentPageSection[] =
    [];

  let currentPages: ParsedPage[] = [];
  let currentCharacterCount = 0;

  function saveCurrentSection() {
    if (currentPages.length === 0) {
      return;
    }

    const sectionContent =
      buildSectionContent(
        currentPages
      );

    const firstPage =
      currentPages[0];

    const lastPage =
      currentPages[
        currentPages.length - 1
      ];

    sections.push({
      sectionIndex:
        sections.length,

      startPage:
        firstPage.pageNumber,

      endPage:
        lastPage.pageNumber,

      content:
        sectionContent,

      pageCount:
        currentPages.length,

      characterCount:
        sectionContent.length,
    });

    currentPages = [];
    currentCharacterCount = 0;
  }

  for (const page of pages) {
    const pageCharacterCount =
      page.content.length;

    const reachedPageLimit =
      currentPages.length >=
      pagesPerSection;

    const reachedCharacterLimit =
      currentPages.length > 0 &&
      currentCharacterCount +
        pageCharacterCount >
        maxCharactersPerSection;

    if (
      reachedPageLimit ||
      reachedCharacterLimit
    ) {
      saveCurrentSection();
    }

    currentPages.push(page);

    currentCharacterCount +=
      pageCharacterCount;
  }

  saveCurrentSection();

  return sections;
}

/**
 * نسخة مختصرة مناسبة للتسجيل في Terminal.
 */
export function getSectionSummary(
  sections: DocumentPageSection[]
) {
  return sections.map((section) => ({
    sectionIndex:
      section.sectionIndex,

    pages:
      `${section.startPage}-${section.endPage}`,

    pageCount:
      section.pageCount,

    characterCount:
      section.characterCount,
  }));
}