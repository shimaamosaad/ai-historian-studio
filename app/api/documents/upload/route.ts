import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import fs from "fs/promises";
import path from "path";

import sharp from "sharp";

import { getDocumentProxy, extractText } from "unpdf";
import { pdf } from "pdf-to-img";
import { createWorker } from "tesseract.js";

import { analyzeDocument } from "@/lib/ai/analyzeDocument";
import { saveEntities } from "@/lib/ai/saveEntities";

export const runtime = "nodejs";
export const maxDuration = 300;

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfDocument = await getDocumentProxy(
    new Uint8Array(buffer)
  );

  const result = await extractText(pdfDocument, {
    mergePages: true,
  });

  console.log("========== UNPDF RESULT ==========");
  console.dir(result, {
    depth: null,
  });
  console.log("==================================");

  return result.text.trim();
}

async function extractPdfTextWithOCR(
  buffer: Buffer
): Promise<string> {

  console.log("========== OCR START ==========");

  const worker = await createWorker(
    "ara+eng",
    undefined,
    {
      workerPath:
        "./node_modules/tesseract.js/src/worker-script/node/index.js",
    }
  );

  let ocrText = "";

  const document = await pdf(buffer);

  let pageNumber = 1;

  for await (const image of document) {

    console.log(`OCR page ${pageNumber}`);
    console.log(
  "Image type:",
  image.constructor.name
);

    const imageBuffer = Buffer.isBuffer(image)
      ? image
      : Buffer.from(image);

    const enhancedImage = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();

    const result = await worker.recognize(
      enhancedImage
    );

    ocrText += "\n" + result.data.text;

    pageNumber++;
  }

  await worker.terminate();

  console.log("========== OCR RESULT ==========");
  console.log(ocrText);
  console.log("================================");

  return ocrText.trim();
}
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const projectIdValue = formData.get("projectId");


    if (!file) {
      return NextResponse.json(
        {
          error: "No file uploaded.",
        },
        {
          status: 400,
        }
      );
    }


    if (!projectIdValue) {
      return NextResponse.json(
        {
          error: "Missing projectId.",
        },
        {
          status: 400,
        }
      );
    }


    const projectId = Number(projectIdValue);


    if (Number.isNaN(projectId)) {
      return NextResponse.json(
        {
          error: "Invalid projectId.",
        },
        {
          status: 400,
        }
      );
    }


    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });


    if (!project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        {
          status: 404,
        }
      );
    }


    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "Only PDF files are supported currently.",
        },
        {
          status: 400,
        }
      );
    }


    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);


    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );


    await fs.mkdir(uploadDir, {
      recursive: true,
    });


    const safeName =
      `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;


    const filePath = path.join(
      uploadDir,
      safeName
    );


    await fs.writeFile(
      filePath,
      buffer
    );


    let text = await extractPdfText(buffer);


    console.log("========== PDF TEXT ==========");
    console.log(text);
    console.log(
      "Length:",
      text.length
    );
    console.log("==============================");


    if (!text || text.trim().length === 0) {

      console.log(
        "Scanned PDF detected. Starting OCR..."
      );


      text = await extractPdfTextWithOCR(
        buffer
      );
    }


    if (!text || text.trim().length === 0) {

      return NextResponse.json(
        {
          success: false,
          error:
            "Could not extract text from PDF.",
        },
        {
          status: 400,
        }
      );
    }


    const aiResult = await analyzeDocument(
      text
    );


    await saveEntities(
      projectId,
      aiResult
    );


    const document =
      await prisma.document.create({
        data: {
          name: file.name,

          url: `/uploads/${safeName}`,

          content: text,

          type: "pdf",


          summary:
            aiResult.summary,


          entities: JSON.stringify({
            people: aiResult.people,

            places: aiResult.places,

            events: aiResult.events,

            relations: aiResult.relations,
          }),


          projectId,
        },
      });



    await prisma.project.update({
      where: {
        id: projectId,
      },

      data: {
        summary:
          aiResult.summary,
      },
    });



    return NextResponse.json({
      success: true,

      document,

      ai: aiResult,
    });


  } catch (error) {

    console.error(
      "UPLOAD ERROR:"
    );

    console.error(error);



    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}