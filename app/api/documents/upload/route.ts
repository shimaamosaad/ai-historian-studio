import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const projectIdValue =
      formData.get("projectId");

    const projectId = Number(
      projectIdValue
    );

    if (
      !file ||
      typeof file === "string" ||
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "الملف أو رقم المشروع غير صحيح",
        },
        {
          status: 400,
        }
      );
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          error:
            "يتم دعم ملفات PDF فقط حاليًا",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        select: {
          id: true,
        },
      });

    if (!project) {
      return NextResponse.json(
        {
          error: "المشروع غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const safeOriginalName =
      file.name.replace(
        /[^\w.\-\u0600-\u06FF]+/gu,
        "-"
      );

    const safeName = `${Date.now()}-${safeOriginalName}`;

    const filePath = path.join(
      uploadDir,
      safeName
    );

    const fileBuffer = Buffer.from(
      await file.arrayBuffer()
    );

    await fs.writeFile(
      filePath,
      fileBuffer
    );

    const document =
      await prisma.document.create({
        data: {
          name: file.name,
          url: `/uploads/${safeName}`,
          content: "",
          type: "pdf",
          projectId,
          processingStatus: "QUEUED",
          processedPages: 0,
          totalPages: 0,
          processingError: null,
        },
      });

    return NextResponse.json(
      {
        message:
          "تم رفع المستند وبدأت معالجته",
        document,
      },
      {
        status: 202,
      }
    );
  } catch (error) {
    console.error(
      "Document upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء رفع المستند",
      },
      {
        status: 500,
      }
    );
  }
}