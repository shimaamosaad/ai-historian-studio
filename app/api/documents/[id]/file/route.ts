import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function readDocumentFile(
  documentUrl: string
): Promise<Buffer> {
  if (
    documentUrl.startsWith("https://") &&
    documentUrl.includes(
      ".blob.vercel-storage.com/"
    )
  ) {
    const blob = await get(
      documentUrl,
      {
        access: "private",
      }
    );

    if (
      !blob ||
      blob.statusCode !== 200
    ) {
      throw new Error(
        "BLOB_FILE_NOT_FOUND"
      );
    }

    const arrayBuffer =
      await new Response(
        blob.stream
      ).arrayBuffer();

    return Buffer.from(
      arrayBuffer
    );
  }

  const cleanUrl = documentUrl
    .split("?")[0]
    .replace(/^\/+/, "");

  let baseDirectory: string;
  let relativePath: string;

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
  } else if (
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
    throw new Error(
      "INVALID_DOCUMENT_PATH"
    );
  }

  if (!relativePath) {
    throw new Error(
      "INVALID_DOCUMENT_PATH"
    );
  }

  const filePath = path.resolve(
    baseDirectory,
    relativePath
  );

  if (
    !filePath.startsWith(
      `${baseDirectory}${path.sep}`
    )
  ) {
    throw new Error(
      "UNSAFE_DOCUMENT_PATH"
    );
  }

  try {
    return await fs.readFile(
      filePath
    );
  } catch (error) {
    const fileError =
      error as {
        code?: string;
      };

    if (
      fileError.code === "ENOENT"
    ) {
      throw new Error(
        "LOCAL_FILE_NOT_FOUND"
      );
    }

    throw error;
  }
}

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
          error:
            "المستند غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    let fileBuffer: Buffer;

    try {
      fileBuffer =
        await readDocumentFile(
          document.url
        );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        if (
          error.message ===
            "INVALID_DOCUMENT_PATH" ||
          error.message ===
            "LOCAL_FILE_NOT_FOUND" ||
          error.message ===
            "BLOB_FILE_NOT_FOUND"
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

        if (
          error.message ===
          "UNSAFE_DOCUMENT_PATH"
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
