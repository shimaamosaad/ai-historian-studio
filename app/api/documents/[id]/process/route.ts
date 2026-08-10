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

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { processHierarchicalAnalysis } from "@/lib/ai/history/processHierarchicalAnalysis";
import { normalizeArabicText } from "@/lib/ocr/normalizeArabicText";

export const runtime = "nodejs";
export const maxDuration = 300;

const PAGES_PER_REQUEST = 10;
const MIN_DIRECT_TEXT_QUALITY = 60;
const MIN_FINAL_TEXT_QUALITY = 45;
const MAX_PRIVATE_USE_RATIO = 0.02;
const MIN_DIRECT_PAGE_CHARACTERS = 80;
const MIN_DIRECT_PAGE_QUALITY = 40;
const MIN_OCR_PAGE_CHARACTERS = 40;

const WORD_CHARACTERS_PER_BILLING_PAGE = 2500;

class PageLimitError extends Error {
  requiredPages: number;
  availablePages: number;

  constructor(
    message: string,
    requiredPages: number,
    availablePages: number
  ) {
    super(message);
    this.name = "PageLimitError";
    this.requiredPages = requiredPages;
    this.availablePages = availablePages;
  }
}

function estimateWordBillingPages(
  text: string
): number {
  const normalized = text
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return 1;
  }

  return Math.max(
    1,
    Math.ceil(
      normalized.length /
        WORD_CHARACTERS_PER_BILLING_PAGE
    )
  );
}

async function chargeDocumentPages({
  documentId,
  userId,
  requiredPages,
}: {
  documentId: number;
  userId: string;
  requiredPages: number;
}) {
  if (
    !Number.isInteger(requiredPages) ||
    requiredPages <= 0
  ) {
    throw new Error(
      "تعذر تحديد عدد صفحات المعالجة بصورة صحيحة."
    );
  }

  return prisma.$transaction(
    async (transaction) => {
      const currentDocument =
        await transaction.document.findFirst({
          where: {
            id: documentId,
            project: {
              userId,
            },
          },
          select: {
            id: true,
            billedPages: true,
            usageSource: true,
            usageChargedAt: true,
          },
        });

      if (!currentDocument) {
        throw new Error(
          "المستند غير موجود أو لا تملك صلاحية معالجته."
        );
      }

      if (currentDocument.billedPages > 0) {
        return {
          charged: false,
          billedPages:
            currentDocument.billedPages,
          usageSource:
            currentDocument.usageSource,
          usageChargedAt:
            currentDocument.usageChargedAt,
        };
      }

      const subscription =
        await transaction.subscription.findUnique({
          where: {
            userId,
          },
        });

      if (!subscription) {
        throw new Error(
          "لا يوجد اشتراك مرتبط بهذا الحساب."
        );
      }

      const now = new Date();

      if (
        subscription.plan !== "FREE" &&
        subscription.expiresAt &&
        subscription.expiresAt <= now
      ) {
        throw new Error(
          "انتهت صلاحية الاشتراك. يرجى تجديد الاشتراك للمتابعة."
        );
      }

      const includedPagesAvailable =
        Math.max(
          subscription.pageLimit -
            subscription.usedPages,
          0
        );

      const extraPagesAvailable =
        Math.max(
          subscription.extraPages,
          0
        );

      const totalAvailablePages =
        includedPagesAvailable +
        extraPagesAvailable;

      if (
        requiredPages >
        totalAvailablePages
      ) {
        throw new PageLimitError(
          `هذا المستند يحتاج إلى ${requiredPages} صفحة معالجة، بينما المتاح في رصيدك هو ${totalAvailablePages} صفحة فقط.`,
          requiredPages,
          totalAvailablePages
        );
      }

      const includedPagesToUse =
        Math.min(
          requiredPages,
          includedPagesAvailable
        );

      const extraPagesToUse =
        requiredPages -
        includedPagesToUse;

      const subscriptionUpdate =
        await transaction.subscription.updateMany({
          where: {
            userId,
            usedPages:
              subscription.usedPages,
            extraPages:
              subscription.extraPages,
          },
          data: {
            usedPages: {
              increment:
                includedPagesToUse,
            },
            ...(extraPagesToUse > 0
              ? {
                  extraPages: {
                    decrement:
                      extraPagesToUse,
                  },
                }
              : {}),
            ...(subscription.plan === "FREE"
              ? {
                  freeTrialUsed: true,
                }
              : {}),
          },
        });

      if (
        subscriptionUpdate.count !== 1
      ) {
        throw new Error(
          "تغير رصيد الصفحات أثناء بدء المعالجة. يرجى إعادة المحاولة."
        );
      }

      let usageSource:
        | "INCLUDED_PAGES"
        | "EXTRA_PAGES"
        | "MIXED";

      if (
        includedPagesToUse > 0 &&
        extraPagesToUse > 0
      ) {
        usageSource = "MIXED";
      } else if (
        extraPagesToUse > 0
      ) {
        usageSource = "EXTRA_PAGES";
      } else {
        usageSource = "INCLUDED_PAGES";
      }

      const chargedAt =
        new Date();

      const documentUpdate =
        await transaction.document.updateMany({
          where: {
            id: documentId,
            billedPages: 0,
          },
          data: {
            billedPages:
              requiredPages,
            usageSource,
            usageChargedAt:
              chargedAt,
          },
        });

      if (
        documentUpdate.count !== 1
      ) {
        throw new Error(
          "تعذر تسجيل استهلاك صفحات المستند بصورة آمنة."
        );
      }

      return {
        charged: true,
        billedPages:
          requiredPages,
        usageSource,
        usageChargedAt:
          chargedAt,
      };
    }
  );
}


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
 * تقييم صلاحية النص المباشر لصفحة واحدة.
 * نستخدم حدًا أقل من تقييم المستند الكامل لأن الصفحة
 * الواحدة أقصر بطبيعتها، لكننا نرفض الترميز المشوه.
 */
function isDirectPageTextUsable(
  text: string
): boolean {
  const cleanedText = text.trim();

  if (
    cleanedText.length <
    MIN_DIRECT_PAGE_CHARACTERS
  ) {
    return false;
  }

  if (hasBrokenFontEncoding(cleanedText)) {
    return false;
  }

  const quality =
    evaluateArabicText(cleanedText);

  const letters =
    cleanedText.match(/\p{L}/gu) ?? [];

  return (
    letters.length >= 20 &&
    quality >= MIN_DIRECT_PAGE_QUALITY
  );
}

/*
 * فحص سريع لنتيجة OCR قبل قبولها.
 */
function isOcrPageTextUsable(
  text: string
): boolean {
  const cleanedText = text.trim();

  if (
    cleanedText.length <
    MIN_OCR_PAGE_CHARACTERS
  ) {
    return false;
  }

  if (hasBrokenFontEncoding(cleanedText)) {
    return false;
  }

  return (
    getCorruptedWordRatio(cleanedText) < 0.5
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
async function continueHierarchicalProcessing(
  documentId: number
) {
  const hierarchicalAnalysis =
    await processHierarchicalAnalysis(
      documentId,
      {
        sectionsPerRun: 1,
        pagesPerSection: 10,
        maxCharactersPerSection:
          45_000,
      }
    );

  const updatedDocument =
    await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });

  if (!updatedDocument) {
    throw new Error(
      "تعذر العثور على المستند بعد التحليل الهرمي."
    );
  }

  return {
    ...updatedDocument,
    hierarchicalAnalysis,
  };
}

/*
 * حفظ النص النهائي بعد اكتمال الاستخراج أو OCR،
 * ثم بدء التحليل الهرمي للمستند.
 *
 * لا نعتبر المستند مكتملًا بعد استخراج النص فقط؛
 * بل يظل PROCESSING حتى تحليل جميع الأقسام ودمجها.
 */
async function completeDocumentProcessing({
  documentId,
  content,
  totalPages,
}: {
  documentId: number;
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
    Math.round(
      privateUseRatio * 10000
    ) / 100,
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

  if (
    !aiText ||
    aiText.length < 20
  ) {
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

  /*
   * عند إعادة استخراج النص نحذف الأقسام القديمة،
   * لأن نطاق الصفحات أو محتواها قد يكون قد تغير.
   */
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
        content,
        processingStatus:
          "PROCESSING",
        processedPages:
          totalPages,
        totalPages,
        processingError:
          null,

        sectionAnalysisStatus:
          "PENDING",
        processedSections:
          0,
        totalSections:
          0,
        sectionAnalysisError:
          null,
      },
    }),
  ]);

  /*
   * نحلل قسمًا واحدًا في هذا الطلب.
   * الواجهة ستواصل استدعاء المسار حتى اكتمال
   * جميع الأقسام ثم دمجها في تحليل نهائي.
   */
  return continueHierarchicalProcessing(
    documentId
  );
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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error:
          "يجب تسجيل الدخول أولًا",
      },
      {
        status: 401,
      }
    );
  }

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
    await prisma.document.findFirst({
      where: {
        id: documentId,
        project: {
          userId:
            session.user.id,
        },
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
      "COMPLETED" &&
    document.sectionAnalysisStatus ===
      "COMPLETED"
  ) {
    return NextResponse.json(
      document
    );
  }

  try {
    /*
     * إذا انتهى استخراج كل الصفحات بالفعل،
     * نكمل التحليل الهرمي مباشرةً دون إعادة
     * قراءة الملف أو تشغيل OCR من البداية.
     */
    const hasFinishedTextExtraction =
      Boolean(
        document.content?.trim()
      ) &&
      document.totalPages > 0 &&
      document.processedPages >=
        document.totalPages;

    if (
      hasFinishedTextExtraction &&
      document.sectionAnalysisStatus !==
        "COMPLETED"
    ) {
      if (document.billedPages === 0) {
        await chargeDocumentPages({
          documentId:
            document.id,
          userId:
            session.user.id,
          requiredPages:
            Math.max(
              document.totalPages,
              1
            ),
        });
      }

      const continued =
        await continueHierarchicalProcessing(
          document.id
        );

      return NextResponse.json(
        continued
      );
    }

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

      const wordBillingPages =
        estimateWordBillingPages(
          wordText
        );

      await chargeDocumentPages({
        documentId:
          document.id,
        userId:
          session.user.id,
        requiredPages:
          wordBillingPages,
      });

      const wordContent =
        `[[PAGE:1]]\n${wordText}`;

      const completed =
        await completeDocumentProcessing({
          documentId:
            document.id,
          content:
            wordContent,
          totalPages: 1,
        });

      return NextResponse.json({
        ...completed,
        billing: {
          billedPages:
            wordBillingPages,
          pageCountType:
            "ESTIMATED_FROM_WORD_TEXT",
        },
      });
    }

    const pdfProxy =
      await getDocumentProxy(
        new Uint8Array(buffer)
      );

    const detectedTotalPages =
      pdfProxy.numPages;

    if (
      !Number.isInteger(
        detectedTotalPages
      ) ||
      detectedTotalPages <= 0
    ) {
      throw new Error(
        "تعذر تحديد عدد صفحات ملف PDF."
      );
    }

    await chargeDocumentPages({
      documentId:
        document.id,
      userId:
        session.user.id,
      requiredPages:
        detectedTotalPages,
    });

    /*
     * بعد نجاح حجز رصيد الصفحات نبدأ استخراج النص.
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

    const usableDirectPages =
      extractedPages.filter(
        (pageText) =>
          isDirectPageTextUsable(
            pageText ?? ""
          )
      ).length;

    console.log(
      "========== SELECTIVE OCR CHECK =========="
    );

    console.log(
      "Document ID:",
      document.id
    );

    console.log(
      "Total pages:",
      totalPages
    );

    console.log(
      "Pages with usable direct text:",
      usableDirectPages
    );

    console.log(
      "Pages requiring OCR:",
      Math.max(
        totalPages - usableDirectPages,
        0
      )
    );

    console.log(
      "Whole-document direct quality:",
      directTextQuality
    );

    console.log(
      "========================================="
    );

    /*
     * إذا كانت كل الصفحات تقريبًا صالحة مباشرةً،
     * نستخدم النص المستخرج بدون تشغيل OCR.
     */
    if (usableDirectPages === totalPages) {
      console.log(
        "All PDF pages have usable direct text"
      );

      const completed =
        await completeDocumentProcessing({
          documentId:
            document.id,
          content:
            extractedContent,
          totalPages,
        });

      return NextResponse.json(
        completed
      );
    }

    /*
     * نعالج دفعة من الصفحات، لكن نشغّل OCR فقط
     * على الصفحات التي فشل نصها المباشر.
     */
    const start =
      document.processedPages ?? 0;

    const end = Math.min(
      start + PAGES_PER_REQUEST,
      totalPages
    );

    const pageTexts =
      new Map<number, string>();

    const pagesNeedingOcr: number[] = [];

    for (
      let pageNumber = start + 1;
      pageNumber <= end;
      pageNumber++
    ) {
      const directPageText =
        extractedPages[
          pageNumber - 1
        ]?.trim() ?? "";

      if (
        isDirectPageTextUsable(
          directPageText
        )
      ) {
        pageTexts.set(
          pageNumber,
          directPageText
        );

        console.log(
          `Direct text page ${pageNumber} of ${totalPages}`
        );
      } else {
        pagesNeedingOcr.push(
          pageNumber
        );
      }
    }

    if (pagesNeedingOcr.length > 0) {
      console.log(
        "Selective OCR pages in this batch:",
        pagesNeedingOcr
      );

      const rendered =
        await pdf(buffer, {
          scale: 1.7,
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

      try {
        for (
          const pageNumber of
          pagesNeedingOcr
        ) {
          console.log(
            `Selective OCR page ${pageNumber} of ${totalPages}`
          );

          const image =
            await rendered.getPage(
              pageNumber
            );

          /*
           * المحاولة الأولى خفيفة وسريعة.
           */
          const fastPrepared =
            await sharp(image)
              .rotate()
              .grayscale()
              .resize({
                width: 1900,
                withoutEnlargement:
                  true,
              })
              .normalize()
              .png()
              .toBuffer();

          const fastResult =
            await worker.recognize(
              fastPrepared
            );

          let pageText =
            fastResult.data.text.trim();

          /*
           * نستخدم الفلاتر الثقيلة فقط إذا كانت
           * المحاولة السريعة غير صالحة.
           */
          if (
            !isOcrPageTextUsable(
              pageText
            )
          ) {
            console.log(
              `Retrying page ${pageNumber} with enhanced OCR`
            );

            const enhancedPrepared =
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

            const enhancedResult =
              await worker.recognize(
                enhancedPrepared
              );

            const enhancedText =
              enhancedResult.data.text.trim();

            if (
              enhancedText.length >
              pageText.length
            ) {
              pageText =
                enhancedText;
            }
          }

          pageTexts.set(
            pageNumber,
            pageText
          );
        }
      } finally {
        await worker.terminate();
        await rendered.destroy();
      }
    }

    const batchText =
      Array.from(
        {
          length:
            end - start,
        },
        (_, index) => {
          const pageNumber =
            start + index + 1;

          const pageText =
            pageTexts.get(
              pageNumber
            ) ?? "";

          return (
            `[[PAGE:${pageNumber}]]\n` +
            pageText.trim()
          );
        }
      )
        .join("\n\n")
        .trim();

    const previousContent =
      document.content?.trim() ?? "";

    const combinedContent = [
      previousContent,
      batchText,
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    console.log(
      "Batch pages processed:",
      `${start + 1}-${end}`
    );

    console.log(
      "OCR pages in batch:",
      pagesNeedingOcr.length
    );

    console.log(
      "Direct pages in batch:",
      end -
        start -
        pagesNeedingOcr.length
    );

    /*
     * ما زالت هناك صفحات أخرى.
     */
    if (end < totalPages) {
      const processingDocument =
        await prisma.document.update({
          where: {
            id: document.id,
          },
          data: {
            content:
              combinedContent,
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

    console.log(
      "Selective OCR extraction completed"
    );

    const completed =
      await completeDocumentProcessing({
        documentId:
          document.id,

        content:
          combinedContent,

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

    if (
      error instanceof
      PageLimitError
    ) {
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          processingStatus:
            "QUEUED",
          processingError:
            message,
        },
      });

      return NextResponse.json(
        {
          error: message,
          reason:
            "PAGE_LIMIT_REACHED",
          requiredPages:
            error.requiredPages,
          availablePages:
            error.availablePages,
        },
        {
          status: 429,
        }
      );
    }

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