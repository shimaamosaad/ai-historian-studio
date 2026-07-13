import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";

import { analyzeDocument } from "@/lib/ai/analyzeDocument";
import { saveEntities } from "@/lib/ai/saveEntities";

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
  });

  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const projectIdValue = formData.get("projectId");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!projectIdValue) {
      return NextResponse.json(
        { error: "Missing projectId." },
        { status: 400 }
      );
    }

    const projectId = Number(projectIdValue);

    if (Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid projectId." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error:
            "Only PDF files are supported currently.",
        },
        {
          status: 400,
        }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const safeName =
      `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const filePath = path.join(uploadDir, safeName);

    await fs.writeFile(filePath, buffer);

    const text = await extractPdfText(buffer);

    const aiResult = await analyzeDocument(text);

    await saveEntities(projectId, aiResult);

    const document = await prisma.document.create({
      data: {
        name: file.name,
        url: `/uploads/${safeName}`,
        content: text,
        type: "pdf",

        summary: aiResult.summary,

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
        summary: aiResult.summary,
      },
    });

    return NextResponse.json({
      success: true,
      document,
      ai: aiResult,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:");
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