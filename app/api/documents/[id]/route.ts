import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete document",
      },
      { status: 500 }
    );
  }
}
