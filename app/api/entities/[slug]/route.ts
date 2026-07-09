import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    console.log("==================================");
    console.log("Slug:", slug);
    console.log("Decoded:", decodeURIComponent(slug));
    console.log("==================================");

    const entity = await prisma.entity.findUnique({
      where: {
        slug,
      },
      include: {
        projectEntities: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                period: true,
                summary: true,
              },
            },
          },
        },

        outgoingRelations: {
          include: {
            target: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                summary: true,
              },
            },
          },
        },

        incomingRelations: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                summary: true,
              },
            },
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

    return NextResponse.json({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      type: entity.type,
      summary: entity.summary,
      description: entity.description,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,

      projects: entity.projectEntities.map((relation) => relation.project),

      outgoingRelations: entity.outgoingRelations.map((relation) => ({
        id: relation.id,
        relation: relation.relation,
        confidence: relation.confidence,
        target: relation.target,
      })),

      incomingRelations: entity.incomingRelations.map((relation) => ({
        id: relation.id,
        relation: relation.relation,
        confidence: relation.confidence,
        source: relation.source,
      })),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}