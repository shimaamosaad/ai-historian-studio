import path from "path";
import * as mammoth from "mammoth";
import { getDocumentProxy } from "unpdf";

export type AcademicTextSection = {
  sectionIndex: number;
  startPage: number;
  endPage: number;
  originalText: string;
};

type ExtractionResult = {
  fileType: "pdf" | "docx";
  totalPages: number;
  sections: AcademicTextSection[];
};

const APPROXIMATE_CHARACTERS_PER_PAGE = 3000;
const MAX_SECTION_CHARACTERS = 9000;

function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongText(text: string): string[] {
  const paragraphs = normalizeText(text).split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    if (current && current.length + paragraph.length + 2 > MAX_SECTION_CHARACTERS) {
      chunks.push(current);
      current = "";
    }

    if (paragraph.length <= MAX_SECTION_CHARACTERS) {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    for (let start = 0; start < paragraph.length; start += MAX_SECTION_CHARACTERS) {
      chunks.push(paragraph.slice(start, start + MAX_SECTION_CHARACTERS));
    }
  }

  if (current) chunks.push(current);
  return chunks.filter((chunk) => chunk.trim().length > 0);
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const signature = buffer.subarray(0, Math.min(buffer.length, 1024)).toString("latin1");
  if (!signature.includes("%PDF-")) throw new Error("ملف PDF غير صالح.");

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(normalizeText(text));
  }

  const sections: AcademicTextSection[] = [];
  let pageIndex = 0;

  while (pageIndex < pageTexts.length) {
    const startPage = pageIndex + 1;
    let endPage = startPage;
    let text = "";

    while (pageIndex < pageTexts.length) {
      const nextText = pageTexts[pageIndex];
      if (text && text.length + nextText.length + 2 > MAX_SECTION_CHARACTERS) break;
      text = text ? `${text}\n\n${nextText}` : nextText;
      endPage = pageIndex + 1;
      pageIndex += 1;
    }

    if (!text.trim()) {
      pageIndex += 1;
      continue;
    }

    sections.push({
      sectionIndex: sections.length,
      startPage,
      endPage,
      originalText: text,
    });
  }

  if (sections.length === 0) {
    throw new Error("لم نتمكن من استخراج نص من الملف. ملفات PDF المصورة تحتاج OCR قبل المراجعة.");
  }

  return { fileType: "pdf", totalPages: pdf.numPages, sections };
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  if (buffer.subarray(0, 2).toString("hex") !== "504b") {
    throw new Error("ملف Word غير صالح.");
  }

  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeText(result.value);
  if (!text) throw new Error("ملف Word لا يحتوي على نص قابل للمراجعة.");

  const chunks = splitLongText(text);
  const totalPages = Math.max(1, Math.ceil(text.length / APPROXIMATE_CHARACTERS_PER_PAGE));

  return {
    fileType: "docx",
    totalPages,
    sections: chunks.map((originalText, sectionIndex) => {
      const startCharacter = chunks
        .slice(0, sectionIndex)
        .reduce((total, chunk) => total + chunk.length, 0);
      const startPage = Math.floor(startCharacter / APPROXIMATE_CHARACTERS_PER_PAGE) + 1;
      const endPage = Math.min(
        totalPages,
        Math.max(startPage, Math.ceil((startCharacter + originalText.length) / APPROXIMATE_CHARACTERS_PER_PAGE))
      );
      return { sectionIndex, startPage, endPage, originalText };
    }),
  };
}

export async function extractAcademicDocument(
  buffer: Buffer,
  fileName: string
): Promise<ExtractionResult> {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".pdf") return extractPdf(buffer);
  if (extension === ".docx") return extractDocx(buffer);
  throw new Error("يتم دعم ملفات PDF وWord (.docx) فقط.");
}
