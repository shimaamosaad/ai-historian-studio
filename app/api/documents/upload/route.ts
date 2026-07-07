import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import pdfParse from "pdf-parse";
import fs from "fs/promises";
import path from "path";
import { analyzeDocument } from "@/lib/ai/analyzeDocument";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const projectId = Number(formData.get("projectId"));

    if (!file || isNaN(projectId)) {
      return NextResponse.json(
        { error: "Missing or invalid data" },
        { status: 400 }
      );
    }

    // تحويل الملف إلى Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // إنشاء مجلد uploads إذا لم يكن موجودًا
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // اسم الملف
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // حفظ الملف
    await fs.writeFile(filePath, buffer);

    // استخراج النص من PDF
    let extractedText = "";

    if (file.type === "application/pdf") {
      try {
        const pdf = await pdfParse(buffer);
        extractedText = pdf.text;
      } catch (err) {
        console.error("PDF Parse Error:", err);
      }
    }

    // تحليل AI (إذا وجد نص)
    let summary: string | null = null;
    let entities: any = {
      people: [],
      places: [],
      events: [],
    };

    if (extractedText.trim().length > 0) {
      try {
        const aiResult = await analyzeDocument(extractedText);

        summary = aiResult.summary;
        entities = {
          people: aiResult.people,
          places: aiResult.places,
          events: aiResult.events,
        };
      } catch (err) {
        console.error("AI Analysis Error:", err);
      }
    }

    // حفظ في قاعدة البيانات
    const document = await prisma.document.create({
      data: {
        name: file.name,
        url: `/uploads/${fileName}`,
        content: extractedText,
        type: file.type,
        summary,
        entities,
        projectId,
      },
    });

    return NextResponse.json(document);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Upload failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}