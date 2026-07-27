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
import * as mammoth from "mammoth";

import { prisma } from "@/lib/prisma";
import { analyzeByDomain } from "@/lib/ai/analyzeByDomain";
import { saveEntities } from "@/lib/ai/saveEntities";
import { normalizeArabicText } from "@/lib/ocr/normalizeArabicText";

export const runtime = "nodejs";
export const maxDuration = 300;

const PAGES_PER_REQUEST = 5;
const MIN_DIRECT_TEXT_QUALITY = 60;
const MIN_FINAL_TEXT_QUALITY = 45;
const MAX_PRIVATE_USE_RATIO = 0.02;

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
 
/*
 * حساب نسبة الرموز الموجودة في نطاق Private Use Area.
 *
 * بعض ملفات PDF العربية القديمة تستخدم خطوطًا ترسم الحروف
 * برموز خاصة بدل حروف Unicode العربية الحقيقية.
 *
 * مثال:
 *     
 */
function getPrivateUseRatio(
  text: string
): number {
  const characters = [...text].filter(
    (character) => !/\s/u.test(character)
  );

  if (characters.length === 0) {
    return 0;
  }

  const privateUseCharacters =
    characters.filter((character) => {
      const codePoint =
        character.codePointAt(0) ?? 0;

      return (
        (codePoint >= 0xe000 &&
          codePoint <= 0xf8ff) ||
        (codePoint >= 0xf0000 &&
          codePoint <= 0xffffd) ||
        (codePoint >= 0x100000 &&
          codePoint <= 0x10fffd)
      );
    });

  return (
    privateUseCharacters.length /
    characters.length
  );
}

/*
 * حساب نسبة رموز الاستبدال والتحكم غير الطبيعية.
 */
function getInvalidCharacterRatio(
  text: string
): number {
  const characters = [...text].filter(
    (character) => !/\s/u.test(character)
  );

  if (characters.length === 0) {
    return 0;
  }

  const invalidCharacters =
    characters.filter((character) => {
      const codePoint =
        character.codePointAt(0) ?? 0;

      const isReplacementCharacter =
        character === "\uFFFD";

      const isNullCharacter =
        character === "\u0000";

      const isUnexpectedControlCharacter =
        codePoint < 32 &&
        character !== "\n" &&
        character !== "\r" &&
        character !== "\t";

      return (
        isReplacementCharacter ||
        isNullCharacter ||
        isUnexpectedControlCharacter
      );
    });

  return (
    invalidCharacters.length /
    characters.length
  );
}

/*
 * تحديد ما إذا كان النص يحتوي على ترميز خطوط مشوه.
 */
function hasBrokenFontEncoding(
  text: string
): boolean {
  const privateUseRatio =
    getPrivateUseRatio(text);

  const invalidCharacterRatio =
    getInvalidCharacterRatio(text);

  return (
    privateUseRatio >
      MAX_PRIVATE_USE_RATIO ||
    invalidCharacterRatio > 0.01
  );
}

/*
 * تقييم جودة النص بدرجة من 0 إلى 100.
 *
 * يعتمد التقييم على:
 * - وجود حروف عربية صحيحة.
 * - طول النص.
 * - نسبة الكلمات غير المشوهة.
 * - رموز الخطوط القديمة Private Use Area.
 * - رموز الاستبدال والتحكم غير الطبيعية.
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

  const privateUseRatio =
    getPrivateUseRatio(cleanedText);

  const invalidCharacterRatio =
    getInvalidCharacterRatio(cleanedText);

  const lengthScore = Math.min(
    cleanedText.length / 5000,
    1
  );

  let score = 0;

  score += arabicRatio * 60;
  score += lengthScore * 25;
  score +=
    (1 - corruptedRatio) * 15;

  /*
   * عقوبة قوية للنصوص التي تستخدم رموز خطوط خاصة
   * بدل حروف Unicode العربية.
   */
  score -= privateUseRatio * 400;
  score -=
    invalidCharacterRatio * 500;

  /*
   * إذا زادت رموز Private Use عن 10%
   * فالنص غير صالح للتحليل نهائيًا.
   */
  if (privateUseRatio > 0.1) {
    score = 0;
  }

  if (invalidCharacterRatio > 0.05) {
    score = 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
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

const finalTextQuality =
  evaluateArabicText(aiText);

const privateUseRatio =
  getPrivateUseRatio(aiText);

const invalidCharacterRatio =
  getInvalidCharacterRatio(aiText);

const brokenFontEncoding =
  hasBrokenFontEncoding(aiText);

console.log(
  "========== FINAL TEXT SAFETY CHECK =========="
);

console.log(
  "Final text length:",
  aiText.length
);

console.log(
  "Final text quality:",
  finalTextQuality
);

console.log(
  "Private-use ratio:",
  Math.round(privateUseRatio * 10000) /
    100,
  "%"
);

console.log(
  "Invalid-character ratio:",
  Math.round(
    invalidCharacterRatio * 10000
  ) / 100,
  "%"
);

console.log(
  "Broken font encoding:",
  brokenFontEncoding
);

console.log(
  "============================================="
);

if (!aiText || aiText.length < 20) {
  throw new Error(
    "لم يتم استخراج نص كافٍ من المستند. جرّبي ملفًا أوضح أو نسخة أخرى من المستند."
  );
}

if (brokenFontEncoding) {
  throw new Error(
    "تعذّر تحليل المستند لأن النص المستخرج يستخدم ترميز خط عربي قديمًا أو مشوّهًا. حاول النظام استخدام OCR، لكن النص النهائي ما زال غير صالح للتحليل."
  );
}

if (
  getArabicRatio(aiText) > 0.25 &&
  finalTextQuality <
    MIN_FINAL_TEXT_QUALITY
) {
  throw new Error(
    "جودة النص العربي المستخرج منخفضة جدًا، ولذلك تم إيقاف التحليل لحماية النتائج من الأخطاء. جرّبي نسخة PDF أوضح أو ملف Word."
  );
}

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

    const documentType =
      document.type?.toLowerCase() ?? "";

    const documentName =
      document.name.toLowerCase();

    const isDocx =
      documentType === "docx" ||
      documentName.endsWith(".docx");

    /*
     * ملفات Word لا تحتاج إلى OCR.
     * نستخرج النص مباشرة باستخدام mammoth،
     * ثم نرسله إلى نفس مسار التحليل والحفظ.
     */
    if (isDocx) {
      const result =
        await mammoth.extractRawText({
          buffer,
        });

      const wordText =
        result.value.trim();

      if (!wordText) {
        throw new Error(
          "لم يتم العثور على نص داخل ملف Word"
        );
      }

      const wordContent =
        `[[PAGE:1]]\n${wordText}`;

      const completed =
        await completeDocumentProcessing({
          documentId: document.id,
          projectId: document.projectId,
          content: wordContent,
          totalPages: 1,
        });

      return NextResponse.json(
        completed
      );
    }

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