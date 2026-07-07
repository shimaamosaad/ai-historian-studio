import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const entities = await prisma.entity.findMany({
      include: {
        projectEntities: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      type: entity.type,
      summary: entity.summary,
      description: entity.description,
      projectsCount: entity.projectEntities.length,
      projects: entity.projectEntities.map((relation) => relation.project),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error loading entities:", error);

    return NextResponse.json(
      { error: "Failed to load entities." },
      { status: 500 }
    );
  }
}