import fs from "fs/promises";
import path from "path";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createWorker,
  PSM,
} from "tesseract.js";
import sharp from "sharp";
import { pdf } from "pdf-to-img";
import {
  extractText,
  getDocumentProxy,
} from "unpdf";

import { prisma } from "@/lib/prisma";
import { analyzeByDomain } from "@/lib/ai/analyzeByDomain";
import { saveEntities } from "@/lib/ai/saveEntities";
import { normalizeArabicText } from "@/lib/ocr/normalizeArabicText";

export const runtime = "nodejs";
export const maxDuration = 300;

const PAGES_PER_REQUEST = 5;
const MIN_DIRECT_TEXT_QUALITY = 60;

/*
 * حساب نسبة الحروف العربية داخل النص.
 */
function getArabicRatio(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  const letters =
    text.match(/\p{L}/gu) ?? [];

  const arabicLetters =
    text.match(/[\u0600-\u06FF]/g) ?? [];

  if (letters.length === 0) {
    return 0;
  }

  return (
    arabicLetters.length /
    letters.length
  );
}

/*
 * حساب نسبة الكلمات التي يُحتمل
 * أن تكون مشوهة أو ناتجة عن OCR سيئ.
 */
function getCorruptedWordRatio(
  text: string
): number {
  const words = text
    .split(/\s+/)
    .map((word) =>
      word.replace(
        /[،؛؟.!:()[\]{}"'«»]/g,
        ""
      )
    )
    .filter(Boolean);

  if (words.length === 0) {
    return 1;
  }

  let corruptedWords = 0;

  for (const word of words) {
    const hasRepeatedCharacters =
      /(.)\1{3,}/u.test(word);

    const isTooShort =
      word.length <= 1;

    const hasUnexpectedCharacters =
      /[^\u0600-\u06FFa-zA-Z0-9٠-٩]/u.test(
        word
      );

    if (
      hasRepeatedCharacters ||
      isTooShort ||
      hasUnexpectedCharacters
    ) {
      corruptedWords++;
    }
  }

  return (
    corruptedWords /
    words.length
  );
}

/*
 * تقييم جودة النص بدرجة من 0 إلى 100.
 *
 * الدرجة تعتمد على:
 * - نسبة الحروف العربية.
 * - طول النص.
 * - نسبة الكلمات السليمة.
 */
function evaluateArabicText(
  text: string
): number {
  const cleanedText = text.trim();

  if (!cleanedText) {
    return 0;
  }

  const arabicRatio =
    getArabicRatio(cleanedText);

  const corruptedRatio =
    getCorruptedWordRatio(cleanedText);

  const lengthScore = Math.min(
    cleanedText.length / 5000,
    1
  );

  let score = 0;

  score += arabicRatio * 60;
  score += lengthScore * 25;
  score +=
    (1 - corruptedRatio) * 15;

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
}

/*
 * إضافة رقم الصفحة قبل نص كل صفحة.
 *
 * هذه العلامات تُحفظ داخل Document.content
 * حتى يستطيع البحث إظهار رقم الصفحة.
 */
function addPageMarkers(
  pages: string[]
): string {
  return pages
    .map((pageText, index) => {
      return (
        `[[PAGE:${index + 1}]]\n` +
        pageText.trim()
      );
    })
    .join("\n\n");
}

/*
 * حذف علامات الصفحات من النسخة
 * التي تُرسل إلى التحليل فقط.
 */
function removePageMarkers(
  content: string
): string {
  return content
    .replace(
      /\[\[PAGE:\d+\]\]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * تنفيذ التحليل وحفظ النتائج
 * بعد تحديد النسخة النهائية من النص.
 */
async function completeDocumentProcessing({
  documentId,
  projectId,
  content,
  totalPages,
}: {
  documentId: number;
  projectId: number;
  content: string;
  totalPages: number;
}) {
  const textWithoutMarkers =
    removePageMarkers(content);

  const aiText =
    normalizeArabicText(
      textWithoutMarkers
    );

  const ai =
  await analyzeByDomain(
    aiText,
    "history"
  );

  await saveEntities(
    projectId,
    ai
  );

  await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      summary: ai.summary,
    },
  });

  return prisma.document.update({
    where: {
      id: documentId,
    },
    data: {
      content,
      summary: ai.summary,
      entities: JSON.stringify(ai),
      processingStatus: "COMPLETED",
      processedPages: totalPages,
      totalPages,
      processingError: null,
    },
  });
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;

  const documentId = Number(id);

  if (
    !Number.isInteger(documentId) ||
    documentId <= 0
  ) {
    return NextResponse.json(
      {
        error:
          "رقم المستند غير صحيح",
      },
      {
        status: 400,
      }
    );
  }

  const document =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });

  if (!document) {
    return NextResponse.json(
      {
        error:
          "المستند غير موجود",
      },
      {
        status: 404,
      }
    );
  }

  if (
    document.processingStatus ===
    "COMPLETED"
  ) {
    return NextResponse.json(
      document
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      document.url.replace(/^\//, "")
    );

    const buffer =
      await fs.readFile(filePath);

    const pdfProxy =
      await getDocumentProxy(
        new Uint8Array(buffer)
      );

    /*
     * استخراج النص الأصلي صفحة بصفحة.
     */
    const extracted =
      await extractText(pdfProxy, {
        mergePages: false,
      });

    const totalPages =
      extracted.totalPages;

    const extractedPages =
      Array.isArray(extracted.text)
        ? extracted.text
        : [extracted.text];

    const extractedContent =
      addPageMarkers(
        extractedPages
      );

    const directPlainText =
      removePageMarkers(
        extractedContent
      );

    const directTextQuality =
      evaluateArabicText(
        directPlainText
      );

    console.log(
      "========== TEXT QUALITY =========="
    );

    console.log(
      "Document ID:",
      document.id
    );

    console.log(
      "Direct text length:",
      directPlainText.length
    );

    console.log(
      "Direct text quality:",
      directTextQuality
    );

    console.log(
      "Minimum accepted quality:",
      MIN_DIRECT_TEXT_QUALITY
    );

    console.log(
      "=================================="
    );

    /*
     * إذا كان النص المستخرج مباشرةً جيدًا،
     * نستخدمه بدون تشغيل OCR.
     */
    if (
      directPlainText &&
      directTextQuality >=
        MIN_DIRECT_TEXT_QUALITY
    ) {
      console.log(
        "Direct PDF text selected"
      );

      const completed =
        await completeDocumentProcessing({
          documentId:
            document.id,
          projectId:
            document.projectId,
          content:
            extractedContent,
          totalPages,
        });

      return NextResponse.json(
        completed
      );
    }

    /*
     * إذا كان النص المباشر فارغًا أو ضعيفًا،
     * نبدأ OCR على دفعات.
     */
    console.log(
      "Direct text is weak. Starting OCR..."
    );

    const start =
      document.processedPages ?? 0;

    const end = Math.min(
      start + PAGES_PER_REQUEST,
      totalPages
    );

    const rendered =
      await pdf(buffer, {
        scale: 2,
      });

    const worker =
      await createWorker(
        "ara+eng",
        undefined,
        {
          workerPath:
            "./node_modules/tesseract.js/src/worker-script/node/index.js",
        }
      );

    await worker.setParameters({
      tessedit_pageseg_mode:
        PSM.SINGLE_BLOCK,

      preserve_interword_spaces:
        "1",

      user_defined_dpi:
        "300",
    });

    let batchText = "";

    try {
      for (
        let pageNumber =
          start + 1;
        pageNumber <= end;
        pageNumber++
      ) {
        console.log(
          `OCR page ${pageNumber} of ${totalPages}`
        );

        const image =
          await rendered.getPage(
            pageNumber
          );

        const prepared =
          await sharp(image)
            .rotate()
            .grayscale()
            .resize({
              width: 2400,
              withoutEnlargement:
                true,
            })
            .median(1)
            .normalize()
            .linear(1.25, -20)
            .sharpen({
              sigma: 1.2,
            })
            .threshold(175)
            .png()
            .toBuffer();

        const result =
          await worker.recognize(
            prepared
          );

        const pageText =
          result.data.text.trim();

        batchText +=
          `\n\n[[PAGE:${pageNumber}]]\n${pageText}`;
      }
    } finally {
      await worker.terminate();
      await rendered.destroy();
    }

    const previousContent =
      document.content?.trim() ?? "";

    const ocrContent = [
      previousContent,
      batchText.trim(),
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    /*
     * ما زالت هناك صفحات أخرى.
     * نحفظ التقدم وننتظر طلب المعالجة التالي.
     */
    if (end < totalPages) {
      const processingDocument =
        await prisma.document.update({
          where: {
            id: document.id,
          },
          data: {
            content: ocrContent,
            processingStatus:
              "PROCESSING",
            processedPages: end,
            totalPages,
            processingError: null,
          },
        });

      return NextResponse.json(
        processingDocument
      );
    }

    /*
     * اكتمل OCR لكل الصفحات.
     *
     * الآن نقارن جودة نص OCR
     * مع جودة النص المباشر.
     */
    const ocrPlainText =
      removePageMarkers(
        ocrContent
      );

    const ocrTextQuality =
      evaluateArabicText(
        ocrPlainText
      );

    console.log(
      "========== FINAL TEXT COMPARISON =========="
    );

    console.log(
      "Direct text quality:",
      directTextQuality
    );

    console.log(
      "OCR text quality:",
      ocrTextQuality
    );

    /*
     * نستخدم النص الأعلى جودة.
     *
     * إذا كان النص المباشر فارغًا،
     * يتم استخدام OCR تلقائيًا.
     */
    const shouldUseDirectText =
      Boolean(directPlainText) &&
      directTextQuality >
        ocrTextQuality;

    const finalContent =
      shouldUseDirectText
        ? extractedContent
        : ocrContent;

    console.log(
      "Selected text:",
      shouldUseDirectText
        ? "DIRECT PDF TEXT"
        : "OCR TEXT"
    );

    console.log(
      "==========================================="
    );

    const completed =
      await completeDocumentProcessing({
        documentId:
          document.id,

        projectId:
          document.projectId,

        content:
          finalContent,

        totalPages,
      });

    return NextResponse.json(
      completed
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Processing failed";

    console.error(
      "DOCUMENT PROCESSING ERROR:",
      error
    );

    await prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        processingStatus:
          "FAILED",

        processingError:
          message,
      },
    });

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}