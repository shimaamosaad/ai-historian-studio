import {
  NextRequest,
  NextResponse,
} from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest
) {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const projectIdParam =
      searchParams.get(
        "projectId"
      );

    let projectId:
      | number
      | undefined;

    if (projectIdParam) {
      projectId =
        Number(
          projectIdParam
        );

      if (
        !Number.isInteger(
          projectId
        ) ||
        projectId <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "رقم المشروع غير صحيح.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const documents =
      await prisma.document.findMany({
        where: {
          project: {
            userId:
              session.user.id,
          },

          ...(projectId
            ? {
                projectId,
              }
            : {}),
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    return NextResponse.json(
      documents
    );
  } catch (error) {
    console.error(
      "GET DOCUMENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch documents",
      },
      {
        status: 500,
      }
    );
  }
}