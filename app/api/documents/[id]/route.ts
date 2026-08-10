import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveEntities } from "@/lib/ai/saveEntities";

import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type StoredRelation = {
  source: string;
  relation: string;
  target: string;
};

type StoredDocumentAnalysis = {
  summary: string;
  people: string[];
  places: string[];
  events: string[];
  relations: StoredRelation[];
};

function cleanString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";
}

function cleanStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => cleanString(item))
        .filter(Boolean)
    )
  );
}

function cleanRelations(
  value: unknown
): StoredRelation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const relations: StoredRelation[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const candidate = item as {
      source?: unknown;
      relation?: unknown;
      target?: unknown;
    };

    const source = cleanString(
      candidate.source
    );

    const relation = cleanString(
      candidate.relation
    );

    const target = cleanString(
      candidate.target
    );

    if (
      !source ||
      !relation ||
      !target
    ) {
      continue;
    }

    const key = [
      source,
      relation,
      target,
    ]
      .join("|")
      .toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    relations.push({
      source,
      relation,
      target,
    });
  }

  return relations;
}

function parseDocumentAnalysis(
  entities: string | null,
  fallbackSummary: string | null
): StoredDocumentAnalysis | null {
  if (!entities) {
    return null;
  }

  try {
    const parsed: unknown =
      JSON.parse(entities);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    const result = parsed as {
      summary?: unknown;
      people?: unknown;
      places?: unknown;
      events?: unknown;
      relations?: unknown;
    };

    const summary =
      cleanString(result.summary) ||
      cleanString(fallbackSummary);

    const analysis: StoredDocumentAnalysis = {
      summary,

      people:
        cleanStringArray(
          result.people
        ),

      places:
        cleanStringArray(
          result.places
        ),

      events:
        cleanStringArray(
          result.events
        ),

      relations:
        cleanRelations(
          result.relations
        ),
    };

    const hasUsefulData =
      Boolean(analysis.summary) ||
      analysis.people.length > 0 ||
      analysis.places.length > 0 ||
      analysis.events.length > 0 ||
      analysis.relations.length > 0;

    return hasUsefulData
      ? analysis
      : null;
  } catch (error) {
    console.error(
      "Failed to parse stored document analysis:",
      error
    );

    return null;
  }
}

/**
 * يعيد بناء معرفة المشروع اعتمادًا على
 * المستندات المتبقية بعد حذف مستند.
 *
 * ملحوظة:
 * قاعدة البيانات الحالية تربط الكيانات بالمشروع،
 * وليس بالمستند مباشرة؛ لذلك نعيد إنشاء روابط
 * المشروع من تحليلات المستندات المتبقية.
 */
async function rebuildProjectKnowledge(
  projectId: number
) {
  const remainingDocuments =
    await prisma.document.findMany({
      where: {
        projectId,
      },

      orderBy: {
        createdAt: "asc",
      },

      select: {
        id: true,
        summary: true,
        entities: true,
        processingStatus: true,
      },
    });

  /*
   * نمسح روابط المشروع الحالية فقط.
   * لا نمسح الكيانات نفسها الآن، لأنها قد تكون
   * مستخدمة في مشروع آخر.
   */
  await prisma.projectEntity.deleteMany({
    where: {
      projectId,
    },
  });

  const validAnalyses:
    StoredDocumentAnalysis[] = [];

  for (const document of remainingDocuments) {
    if (
      document.processingStatus !==
      "COMPLETED"
    ) {
      continue;
    }

    const analysis =
      parseDocumentAnalysis(
        document.entities,
        document.summary
      );

    if (!analysis) {
      continue;
    }

    validAnalyses.push(analysis);

    await saveEntities(
      projectId,
      analysis
    );
  }

  /*
   * حذف العلاقات التي أصبحت أطرافها كيانات
   * غير مرتبطة بأي مشروع.
   *
   * العلاقات التي تخص كيانات ما زالت مشتركة
   * مع مشروعات أخرى تظل محفوظة لحمايتها.
   */
  const orphanEntities =
    await prisma.entity.findMany({
      where: {
        projectEntities: {
          none: {},
        },
      },

      select: {
        id: true,
      },
    });

  const orphanEntityIds =
    orphanEntities.map(
      (entity) => entity.id
    );

  if (orphanEntityIds.length > 0) {
    await prisma.entityRelation.deleteMany({
      where: {
        OR: [
          {
            sourceId: {
              in: orphanEntityIds,
            },
          },
          {
            targetId: {
              in: orphanEntityIds,
            },
          },
        ],
      },
    });

    await prisma.entity.deleteMany({
      where: {
        id: {
          in: orphanEntityIds,
        },
      },
    });
  }

  /*
   * نستخدم آخر ملخص متاح من المستندات المتبقية.
   * لا نستدعي OpenAI أثناء الحذف حتى تكون
   * العملية سريعة ولا تستهلك رصيدًا.
   */
  const projectSummary =
    [...validAnalyses]
      .reverse()
      .find(
        (analysis) =>
          analysis.summary
      )
      ?.summary ?? null;

  await prisma.project.update({
    where: {
      id: projectId,
    },

    data: {
      summary:
        projectSummary,
    },
  });

  return {
    remainingDocuments:
      remainingDocuments.length,

    rebuiltAnalyses:
      validAnalyses.length,

    deletedOrphanEntities:
      orphanEntityIds.length,
  };
}

async function deletePhysicalFile(
  documentUrl: string
) {
  if (!documentUrl) {
    return;
  }

  try {
    const cleanUrl = documentUrl
      .split("?")[0]
      .replace(/^\/+/, "");

    const publicDirectory =
      path.resolve(
        process.cwd(),
        "public"
      );

    const resolvedFilePath =
      path.resolve(
        publicDirectory,
        cleanUrl
      );

    const isInsidePublic =
      resolvedFilePath ===
        publicDirectory ||
      resolvedFilePath.startsWith(
        `${publicDirectory}${path.sep}`
      );

    if (!isInsidePublic) {
      console.warn(
        "Skipped deleting a file outside the public directory:",
        resolvedFilePath
      );

      return;
    }

    await fs.unlink(
      resolvedFilePath
    );
  } catch (error) {
    const fileError = error as {
      code?: string;
    };

    if (
      fileError.code !== "ENOENT"
    ) {
      console.error(
        "Failed to delete document file:",
        error
      );
    }
  }
}

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    const documentId = Number(id);

    if (
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "رقم المستند غير صحيح",
        },
        {
          status: 400,
        }
      );
    }

    const existingDocument =
      await prisma.document.findFirst({
        where: {
          id: documentId,
          project: {
            userId: session.user.id,
          },
        },
        select: {
          id: true,
        },
      });

    if (!existingDocument) {
      return NextResponse.json(
        {
          error: "المستند غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await req.json();

    const { name, content } =
      body;

    const document =
      await prisma.document.update({
        where: {
          id: existingDocument.id,
        },

        data: {
          ...(name !== undefined && {
            name:
              typeof name === "string"
                ? name.trim()
                : name,
          }),

          ...(content !== undefined && {
            content:
              typeof content === "string"
                ? content
                : "",
          }),
        },
      });

    return NextResponse.json(
      document
    );
  } catch (error) {
    console.error(
      "UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "فشل تحديث المستند",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;
    const documentId = Number(id);

    if (
      !Number.isInteger(documentId) ||
      documentId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "رقم المستند غير صحيح",
        },
        {
          status: 400,
        }
      );
    }

    const document =
      await prisma.document.findFirst({
        where: {
          id: documentId,
          project: {
            userId: session.user.id,
          },
        },

        select: {
          id: true,
          name: true,
          url: true,
          projectId: true,

          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          error:
            "المستند غير موجود",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * حذف المستند يؤدي تلقائيًا إلى حذف:
     * - DocumentSection
     * - الملخص
     * - التحليل
     * - النص المستخرج
     *
     * لأن DocumentSection مرتبط بالمستند
     * باستخدام onDelete: Cascade.
     */
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });

    /*
     * إعادة بناء كيانات المشروع من
     * المستندات التي ما زالت موجودة.
     */
    const rebuildResult =
      await rebuildProjectKnowledge(
        document.projectId
      );

    /*
     * نحذف الملف الفعلي بعد نجاح حذف
     * السجل وإعادة بناء بيانات المشروع.
     */
    await deletePhysicalFile(
      document.url
    );

    return NextResponse.json({
      success: true,

      message:
        "تم حذف المستند وتحليله وأقسامه وتحديث معرفة المشروع بنجاح.",

      document: {
        id:
          document.id,

        name:
          document.name,

        projectId:
          document.projectId,

        deletedSections:
          document._count.sections,
      },

      knowledgeRebuild: {
        remainingDocuments:
          rebuildResult.remainingDocuments,

        rebuiltAnalyses:
          rebuildResult.rebuiltAnalyses,

        deletedOrphanEntities:
          rebuildResult.deletedOrphanEntities,
      },
    });
  } catch (error) {
    console.error(
      "DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "حدث خطأ أثناء حذف المستند وتحديث بيانات المشروع",
      },
      {
        status: 500,
      }
    );
  }
}