import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { analyzeDocument } from "@/lib/ai/analyzeDocument";
import { saveEntities } from "@/lib/ai/saveEntities";
import { auth } from "@/auth";


/**
 * GET /api/projects
 *
 * يعرض مشروعات المستخدم المسجل فقط.
 */
export async function GET() {
  try {
    console.log("========== GET /api/projects ==========");

    const session = await auth();
const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا",
        },
        {
          status: 401,
        }
      );
    }

    const projects = await prisma.project.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        documents: {
          select: {
            id: true,
            processingStatus: true,
          },
        },
      },
    });

    console.log(`Projects found for user ${userId}: ${projects.length}`);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects ERROR");
    console.error(error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST /api/projects
 *
 * ينشئ مشروعًا مرتبطًا بالمستخدم المسجل.
 */
export async function POST(request: NextRequest) {
  try {
    console.log("========== CREATE PROJECT ==========");

    const session = await auth();
const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    console.log("Request Body:");
    console.log(body);

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const period =
      typeof body.period === "string" ? body.period.trim() : "";

    if (!title || !description || !period) {
      console.log("Missing required fields");

      return NextResponse.json(
        {
          error: "جميع الحقول مطلوبة",
        },
        {
          status: 400,
        }
      );
    }

    console.log(`Creating project for user: ${userId}`);

    const project = await prisma.project.create({
      data: {
        title,
        description,
        period,
        userId,
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

    const result = await prisma.project.findFirst({
      where: {
        id: project.id,
        userId,
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

    return NextResponse.json(result, {
      status: 201,
    });
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