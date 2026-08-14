import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا",
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
          error: "رقم المستند غير صحيح",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * لا نحصل على المستند إلا إذا كان المشروع
     * مملوكًا للمستخدم الحالي.
     */
    const document =
      await prisma.document.findFirst({
        where: {
          id: documentId,
          project: {
            userId: session.user.id,
          },
        },

        select: {
          id: true,
          name: true,
          url: true,
          type: true,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          error: "المستند غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    const cleanUrl = document.url
      .split("?")[0]
      .replace(/^\/+/, "");

    let baseDirectory: string;
    let relativePath: string;

    /*
     * الملفات الجديدة الخاصة.
     */
    if (
      cleanUrl.startsWith(
        "storage/uploads/"
      )
    ) {
      baseDirectory = path.resolve(
        process.cwd(),
        "storage",
        "uploads"
      );

      relativePath = cleanUrl.slice(
        "storage/uploads/".length
      );
    }

    /*
     * الملفات القديمة.
     */
    else if (
      cleanUrl.startsWith(
        "uploads/"
      )
    ) {
      baseDirectory = path.resolve(
        process.cwd(),
        "public",
        "uploads"
      );

      relativePath = cleanUrl.slice(
        "uploads/".length
      );
    } else {
      return NextResponse.json(
        {
          error:
            "مسار ملف المستند غير صالح",
        },
        {
          status: 404,
        }
      );
    }

    if (!relativePath) {
      return NextResponse.json(
        {
          error:
            "مسار ملف المستند غير صالح",
        },
        {
          status: 404,
        }
      );
    }

    const filePath = path.resolve(
      baseDirectory,
      relativePath
    );

    /*
     * منع ../ ومحاولات الخروج من uploads.
     */
    if (
      !filePath.startsWith(
        `${baseDirectory}${path.sep}`
      )
    ) {
      return NextResponse.json(
        {
          error:
            "مسار ملف المستند غير مسموح",
        },
        {
          status: 403,
        }
      );
    }

    let fileBuffer: Buffer;

    try {
      fileBuffer =
        await fs.readFile(filePath);
    } catch (error) {
      const fileError =
        error as {
          code?: string;
        };

      if (
        fileError.code === "ENOENT"
      ) {
        return NextResponse.json(
          {
            error:
              "ملف المستند غير موجود على الخادم",
          },
          {
            status: 404,
          }
        );
      }

      throw error;
    }

    const lowerName =
      document.name.toLowerCase();

    let contentType =
      "application/octet-stream";

    if (
      document.type?.toLowerCase() ===
        "pdf" ||
      lowerName.endsWith(".pdf")
    ) {
      contentType =
        "application/pdf";
    } else if (
      document.type?.toLowerCase() ===
        "docx" ||
      lowerName.endsWith(".docx")
    ) {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    const url =
      new URL(request.url);

    const shouldDownload =
      url.searchParams.get(
        "download"
      ) === "1";

    /*
     * اسم ASCII احتياطي + الاسم الأصلي UTF-8.
     */
    const encodedFileName =
      encodeURIComponent(
        document.name
      );

    const disposition =
      shouldDownload
        ? "attachment"
        : "inline";

    return new NextResponse(
      new Uint8Array(fileBuffer),
      {
        status: 200,

        headers: {
          "Content-Type":
            contentType,

          "Content-Length":
            String(
              fileBuffer.length
            ),

          "Content-Disposition":
            `${disposition}; filename="document"; filename*=UTF-8''${encodedFileName}`,

          "Cache-Control":
            "private, no-store, max-age=0",

          "X-Content-Type-Options":
            "nosniff",
        },
      }
    );
  } catch (error) {
    console.error(
      "DOCUMENT FILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر فتح ملف المستند",
      },
      {
        status: 500,
      }
    );
  }
}