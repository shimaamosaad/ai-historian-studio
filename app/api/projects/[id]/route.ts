import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const projectId = Number(id);

    if (Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project id" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        documents: true,
        projectEntities: {
          include: {
            entity: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const projectId = Number(id);

    if (Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const data: any = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.period !== undefined) data.period = body.period;

    if (!data.title || !data.description || !data.period) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    const projectId = Number(id);

    if (Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project id" },
        { status: 400 }
      );
    }

    // حذف العلاقات مع الكيانات
    await prisma.projectEntity.deleteMany({
      where: {
        projectId,
      },
    });

    // حذف المستندات التابعة للمشروع
    await prisma.document.deleteMany({
      where: {
        projectId,
      },
    });

    // حذف المشروع
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete project",
      },
      {
        status: 500,
      }
    );
  }
}