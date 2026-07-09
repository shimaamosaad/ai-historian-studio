import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const entity = await prisma.entity.findUnique({
      where: {
        slug,
      },
      include: {
        outgoingRelations: {
          include: {
            target: true,
          },
        },

        incomingRelations: {
          include: {
            source: true,
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

    const nodes: any[] = [];
    const edges: any[] = [];

    // الكيان الرئيسي
    nodes.push({
      id: entity.slug,
      slug: entity.slug,
      label: entity.name,
      type: entity.type,
      summary: entity.summary,
      description: entity.description,
      center: true,
    });

    // العلاقات الصادرة
    for (const relation of entity.outgoingRelations) {
      nodes.push({
        id: relation.target.slug,
        slug: relation.target.slug,
        label: relation.target.name,
        type: relation.target.type,
        summary: relation.target.summary,
        description: relation.target.description,
      });

      edges.push({
        id: `out-${relation.id}`,
        source: entity.slug,
        target: relation.target.slug,
        label: relation.relation,
        confidence: relation.confidence,
      });
    }

    // العلاقات الواردة
    for (const relation of entity.incomingRelations) {
      nodes.push({
        id: relation.source.slug,
        slug: relation.source.slug,
        label: relation.source.name,
        type: relation.source.type,
        summary: relation.source.summary,
        description: relation.source.description,
      });

      edges.push({
        id: `in-${relation.id}`,
        source: relation.source.slug,
        target: entity.slug,
        label: relation.relation,
        confidence: relation.confidence,
      });
    }

    // إزالة التكرار
    const uniqueNodes = Array.from(
      new Map(nodes.map((node) => [node.id, node])).values()
    );

    return NextResponse.json({
      center: {
        id: entity.slug,
        slug: entity.slug,
        name: entity.name,
        type: entity.type,
      },

      nodes: uniqueNodes,

      edges,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}