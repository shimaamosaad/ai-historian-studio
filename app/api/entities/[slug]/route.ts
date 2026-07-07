import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { slug } = await params;

    const entity = await prisma.entity.findUnique({
      where: {
        slug,
      },
      include: {
        projectEntities: {
          include: {
            project: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!entity) {
      return NextResponse.json(
        {
          error: "Entity not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(entity);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load entity",
      },
      {
        status: 500,
      }
    );
  }
}