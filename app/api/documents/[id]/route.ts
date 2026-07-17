import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { name, content } = body;

    const document = await prisma.document.update({
      where: {
        id: Number(id),
      },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      select: {
        id: true,
        name: true,
        url: true,
        projectId: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "المستند غير موجود" },
        { status: 404 }
      );
    }

    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    if (document.url) {
      try {
        const cleanUrl = document.url
          .split("?")[0]
          .replace(/^\/+/, "");

        const publicDirectory = path.resolve(
          process.cwd(),
          "public"
        );

        const resolvedFilePath = path.resolve(
          publicDirectory,
          cleanUrl
        );

        const isInsidePublic =
          resolvedFilePath === publicDirectory ||
          resolvedFilePath.startsWith(
            `${publicDirectory}${path.sep}`
          );

        if (isInsidePublic) {
          await fs.unlink(resolvedFilePath);
        }
      } catch (fileError: any) {
        if (fileError?.code !== "ENOENT") {
          console.error(
            "Failed to delete document file:",
            fileError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المستند بنجاح",
      document: {
        id: document.id,
        name: document.name,
        projectId: document.projectId,
      },
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المستند" },
      { status: 500 }
    );
  }
}