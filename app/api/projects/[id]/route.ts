import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: NextRequest, { params }: Params) {
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

    const { title, description, period, region, language } = body;

    if (
      !title ||
      !description ||
      !period ||
      !region ||
      !language
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        title,
        description,
        period,
        region,
        language,
      },
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
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}