import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects:", error);

    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !body.title ||
      !body.description ||
      !body.period ||
      !body.region ||
      !body.language
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title: body.title,
        description: body.description,
        period: body.period,
        region: body.region,
        language: body.language,
      },
    });

    return NextResponse.json(project, {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/projects:", error);

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}