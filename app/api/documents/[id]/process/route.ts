import fs from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { createWorker, PSM } from "tesseract.js";
import sharp from "sharp";
import { pdf } from "pdf-to-img";
import { extractText, getDocumentProxy } from "unpdf";
import { prisma } from "@/lib/prisma";
import { analyzeDocument } from "@/lib/ai/analyzeDocument";
import { saveEntities } from "@/lib/ai/saveEntities";
import { normalizeArabicText } from "@/lib/ocr/normalizeArabicText";

export const runtime = "nodejs";
export const maxDuration = 300;

const PAGES_PER_REQUEST = 2;

function addPageMarkers(pages: string[]): string {
  return pages
    .map((pageText, index) => {
      return `[[PAGE:${index + 1}]]\n${pageText.trim()}`;
    })
    .join("\n\n");
}

/*
 * نحذف علامات الصفحات من نسخة النص المرسلة للتحليل فقط.
 * النص المحفوظ داخل Document.content يظل محتفظًا بالعلامات
 * لاستخدامها في البحث وإظهار رقم الصفحة.
 */
function removePageMarkers(content: string): string {
  return content
    .replace(/\[\[PAGE:\d+\]\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const documentId = Number(id);

  if (!Number.isInteger(documentId) || documentId <= 0) {
    return NextResponse.json(
      { error: "رقم المستند غير صحيح" },
      { status: 400 }
    );
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId,
    },
  });

  if (!document) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  if (document.processingStatus === "COMPLETED") {
    return NextResponse.json(document);
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      document.url.replace(/^\//, "")
    );

    const buffer = await fs.readFile(filePath);

    const pdfProxy = await getDocumentProxy(
      new Uint8Array(buffer)
    );

    /*
     * mergePages: false يجعل unpdf يعيد مصفوفة،
     * كل عنصر فيها يمثل نص صفحة واحدة.
     */
    const extracted = await extractText(pdfProxy, {
      mergePages: false,
    });

    const totalPages = extracted.totalPages;

    const extractedPages = Array.isArray(extracted.text)
      ? extracted.text
      : [extracted.text];

    const extractedContent =
      addPageMarkers(extractedPages);

    /*
     * لو الملف يحتوي أصلًا على نص قابل للاستخراج،
     * نحفظه مع أرقام الصفحات وننهي المعالجة.
     */
    if (
      removePageMarkers(extractedContent).trim()
    ) {
      /*
       * هذه النسخة فقط هي التي تُرسل للتحليل،
       * ولذلك لن تظهر [[PAGE:1]] داخل الملخص.
       */
      const aiText = normalizeArabicText(
        removePageMarkers(extractedContent)
      );

      const ai = await analyzeDocument(aiText);

      await saveEntities(document.projectId, ai);

      await prisma.project.update({
        where: {
          id: document.projectId,
        },
        data: {
          summary: ai.summary,
        },
      });

      const completed =
        await prisma.document.update({
          where: {
            id: document.id,
          },
          data: {
            /*
             * نحفظ النص بعلامات الصفحات
             * لاستخدامها في البحث والاستشهاد.
             */
            content: extractedContent,
            summary: ai.summary,
            entities: JSON.stringify(ai),
            processingStatus: "COMPLETED",
            processedPages: totalPages,
            totalPages,
            processingError: null,
          },
        });

      return NextResponse.json(completed);
    }

    /*
     * لو الملف سكان، نبدأ OCR على دفعات.
     */
    const start = document.processedPages ?? 0;

    const end = Math.min(
      start + PAGES_PER_REQUEST,
      totalPages
    );

    const rendered = await pdf(buffer, {
      scale: 2,
    });

    const worker = await createWorker(
      "ara+eng",
      undefined,
      {
        workerPath:
          "./node_modules/tesseract.js/src/worker-script/node/index.js",
      }
    );

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    let batchText = "";

    try {
      for (
        let pageNumber = start + 1;
        pageNumber <= end;
        pageNumber++
      ) {
        const image =
          await rendered.getPage(pageNumber);

        const prepared = await sharp(image)
          .rotate()
          .grayscale()
          .resize({
            width: 2400,
            withoutEnlargement: true,
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
          await worker.recognize(prepared);

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

    const content = [
      previousContent,
      batchText.trim(),
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    /*
     * ما زالت هناك صفحات لم تُعالج.
     */
    if (end < totalPages) {
      const processingDocument =
        await prisma.document.update({
          where: {
            id: document.id,
          },
          data: {
            content,
            processingStatus: "PROCESSING",
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
     * انتهت جميع صفحات OCR.
     *
     * نحذف علامات الصفحات من نسخة التحليل فقط.
     */
    const aiText = normalizeArabicText(
      removePageMarkers(content)
    );

    const ai = await analyzeDocument(aiText);

    await saveEntities(document.projectId, ai);

    await prisma.project.update({
      where: {
        id: document.projectId,
      },
      data: {
        summary: ai.summary,
      },
    });

    const completed =
      await prisma.document.update({
        where: {
          id: document.id,
        },
        data: {
          /*
           * النص المحفوظ يظل محتفظًا بأرقام الصفحات.
           */
          content,
          summary: ai.summary,
          entities: JSON.stringify(ai),
          processingStatus: "COMPLETED",
          processedPages: totalPages,
          totalPages,
          processingError: null,
        },
      });

    return NextResponse.json(completed);
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
        processingStatus: "FAILED",
        processingError: message,
      },
    });

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}