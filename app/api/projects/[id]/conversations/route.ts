import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getOwnedProject(projectId: number, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = Number(id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: "رقم المشروع غير صحيح." },
        { status: 400 }
      );
    }

    const project = await getOwnedProject(projectId, session.user.id);

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود أو لا تملك صلاحية الوصول إليه." },
        { status: 404 }
      );
    }

    const conversation = await prisma.projectConversation.findFirst({
      where: {
        projectId,
        documentId: null,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ conversation: null });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          confidence: message.confidence,
          sourceDocumentCount: message.sourceDocumentCount,
          createdAt: message.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET PROJECT CONVERSATION ERROR:", error);

    return NextResponse.json(
      { error: "تعذر تحميل محادثة المشروع." },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = Number(id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return NextResponse.json(
        { error: "رقم المشروع غير صحيح." },
        { status: 400 }
      );
    }

    const project = await getOwnedProject(projectId, session.user.id);

    if (!project) {
      return NextResponse.json(
        { error: "المشروع غير موجود أو لا تملك صلاحية الوصول إليه." },
        { status: 404 }
      );
    }

    const conversation = await prisma.projectConversation.create({
      data: {
        projectId,
        documentId: null,
        title: "محادثة بحثية جديدة",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { conversation },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PROJECT CONVERSATION ERROR:", error);

    return NextResponse.json(
      { error: "تعذر إنشاء محادثة جديدة." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = Number(id);

    const conversationId = Number(
      request.nextUrl.searchParams.get("conversationId")
    );

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0 ||
      !Number.isInteger(conversationId) ||
      conversationId <= 0
    ) {
      return NextResponse.json(
        { error: "بيانات المحادثة غير صحيحة." },
        { status: 400 }
      );
    }

    const conversation = await prisma.projectConversation.findFirst({
      where: {
        id: conversationId,
        projectId,
        documentId: null,
        project: {
          userId: session.user.id,
        },
      },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "المحادثة غير موجودة أو لا تملك صلاحية حذفها." },
        { status: 404 }
      );
    }

    await prisma.projectConversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE PROJECT CONVERSATION ERROR:", error);

    return NextResponse.json(
      { error: "تعذر حذف المحادثة." },
      { status: 500 }
    );
  }
}