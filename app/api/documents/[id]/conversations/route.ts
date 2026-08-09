import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getOwnedDocument(
  documentId: number,
  userId: string
) {
  return prisma.document.findFirst({
    where: {
      id: documentId,
      project: {
        userId,
      },
    },
    select: {
      id: true,
      projectId: true,
    },
  });
}

export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا.",
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
          error: "رقم المستند غير صحيح.",
        },
        {
          status: 400,
        }
      );
    }

    const document =
      await getOwnedDocument(
        documentId,
        session.user.id
      );

    if (!document) {
      return NextResponse.json(
        {
          error:
            "المستند غير موجود أو لا تملك صلاحية الوصول إليه.",
        },
        {
          status: 404,
        }
      );
    }

    const conversation =
      await prisma.projectConversation.findFirst({
        where: {
          projectId: document.projectId,
          documentId,
        },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!conversation) {
      return NextResponse.json({
        conversation: null,
      });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        messages:
          conversation.messages.map(
            (message) => ({
              id: message.id,
              role: message.role,
              content: message.content,
              confidence:
                message.confidence,
              sourceDocumentCount:
                message.sourceDocumentCount,
              metadata:
                message.metadata,
              createdAt:
                message.createdAt,
            })
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET DOCUMENT CONVERSATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر تحميل محادثة المستند.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    const documentId = Number(id);

    const document =
      await getOwnedDocument(
        documentId,
        session.user.id
      );

    if (!document) {
      return NextResponse.json(
        {
          error:
            "المستند غير موجود أو لا تملك صلاحية الوصول إليه.",
        },
        {
          status: 404,
        }
      );
    }

    const conversation =
      await prisma.projectConversation.create({
        data: {
          projectId:
            document.projectId,
          documentId,
          title:
            "محادثة مع المستند",
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json(
      {
        conversation,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE DOCUMENT CONVERSATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر إنشاء محادثة جديدة للمستند.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    const documentId = Number(id);

    const conversationId =
      Number(
        request.nextUrl.searchParams.get(
          "conversationId"
        )
      );

    if (
      !Number.isInteger(documentId) ||
      documentId <= 0 ||
      !Number.isInteger(
        conversationId
      ) ||
      conversationId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "بيانات المحادثة غير صحيحة.",
        },
        {
          status: 400,
        }
      );
    }

    const conversation =
      await prisma.projectConversation.findFirst({
        where: {
          id: conversationId,
          documentId,
          project: {
            userId:
              session.user.id,
          },
        },
        select: {
          id: true,
        },
      });

    if (!conversation) {
      return NextResponse.json(
        {
          error:
            "المحادثة غير موجودة أو لا تملك صلاحية حذفها.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.projectConversation.delete({
      where: {
        id: conversationId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE DOCUMENT CONVERSATION ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "تعذر حذف محادثة المستند.",
      },
      {
        status: 500,
      }
    );
  }
}