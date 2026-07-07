import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analyzeDocument";
import { saveEntities } from "@/lib/ai/saveEntities";

/**
 * GET /api/projects
 */
export async function GET() {
  try {
    console.log("========== GET /api/projects ==========");

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Projects found: ${projects.length}`);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects ERROR");
    console.error(error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 */
export async function POST(request: NextRequest) {
  try {
    console.log("========== CREATE PROJECT ==========");

    const body = await request.json();

    console.log("Request Body:");
    console.log(body);

    const title = body.title?.trim();
    const description = body.description?.trim();
    const period = body.period?.trim();

    if (!title || !description || !period) {
      console.log("Missing required fields");

      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    console.log("Creating project...");

    const project = await prisma.project.create({
      data: {
        title,
        description,
        period,
      },
    });

    console.log("Project created:");
    console.log(project);

    console.log("Starting AI analysis...");

    const analysis = await analyzeDocument(description);

    console.log("AI Analysis completed:");
    console.log(JSON.stringify(analysis, null, 2));

    console.log("Updating summary...");

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        summary: analysis.summary,
      },
    });

    console.log("Summary updated.");

    console.log("Saving entities...");

    await saveEntities(project.id, analysis);

    console.log("Entities saved.");

    console.log("Loading final project...");

    const result = await prisma.project.findUnique({
  where: {
    id: project.id,
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

    console.log("Finished successfully.");
    console.log("==============================");

    return NextResponse.json(result);
  } catch (error) {
    console.error("========== POST /api/projects ERROR ==========");
    console.error(error);

    if (error instanceof Error) {
      console.error(error.stack);
    }

    console.error("==============================================");

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}