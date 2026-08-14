import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

/*
 * =========================================================
 * حذف ملف مستند فعلي بأمان
 *
 * يدعم:
 * - الملفات الجديدة: storage/uploads
 * - الملفات القديمة: public/uploads
 *
 * مع منع Path Traversal.
 * =========================================================
 */
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

    const storageUploadsDirectory =
      path.resolve(
        process.cwd(),
        "storage",
        "uploads"
      );

    const publicUploadsDirectory =
      path.resolve(
        process.cwd(),
        "public",
        "uploads"
      );

    let baseDirectory:
      | string
      | null = null;

    let relativeFilePath:
      | string
      | null = null;

    /*
     * الملفات الجديدة الخاصة.
     */
    if (
      cleanUrl.startsWith(
        "storage/uploads/"
      )
    ) {
      baseDirectory =
        storageUploadsDirectory;

      relativeFilePath =
        cleanUrl.slice(
          "storage/uploads/".length
        );
    }

    /*
     * الملفات القديمة.
     */
    else if (
      cleanUrl.startsWith(
        "uploads/"
      )
    ) {
      baseDirectory =
        publicUploadsDirectory;

      relativeFilePath =
        cleanUrl.slice(
          "uploads/".length
        );
    }

    /*
     * أي مسار آخر لا نحاول حذفه.
     */
    if (
      !baseDirectory ||
      !relativeFilePath
    ) {
      console.warn(
        "Skipped deleting project document with unsupported path:",
        documentUrl
      );

      return;
    }

    const resolvedFilePath =
      path.resolve(
        baseDirectory,
        relativeFilePath
      );

    /*
     * حماية من:
     * ../
     * أو أي محاولة للخروج من uploads.
     */
    const isInsideAllowedDirectory =
      resolvedFilePath.startsWith(
        `${baseDirectory}${path.sep}`
      );

    if (
      !isInsideAllowedDirectory
    ) {
      console.warn(
        "Skipped deleting a file outside the allowed upload directory:",
        resolvedFilePath
      );

      return;
    }

    await fs.unlink(
      resolvedFilePath
    );
  } catch (error) {
    const fileError =
      error as {
        code?: string;
      };

    /*
     * لو الملف غير موجود أصلًا،
     * لا نعتبر ذلك فشلًا في حذف المشروع.
     */
    if (
      fileError.code !== "ENOENT"
    ) {
      console.error(
        "Failed to delete project document file:",
        error
      );
    }
  }
}

/*
 * =========================================================
 * GET PROJECT
 * =========================================================
 */
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const projectId =
      Number(id);

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project id",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * لا يمكن قراءة المشروع إلا إذا كان
     * مملوكًا للمستخدم الحالي.
     */
    const project =
      await prisma.project.findFirst(
        {
          where: {
            id: projectId,
            userId:
              session.user.id,
          },

          include: {
            documents: true,

            projectEntities: {
              include: {
                entity: true,
              },
            },
          },
        }
      );

    if (!project) {
      return NextResponse.json(
        {
          error:
            "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      project
    );
  } catch (error) {
    console.error(
      "GET project error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load project",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * UPDATE PROJECT
 * =========================================================
 */
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const projectId =
      Number(id);

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project id",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * التأكد من ملكية المشروع
     * قبل السماح بالتعديل.
     */
    const existingProject =
      await prisma.project.findFirst(
        {
          where: {
            id: projectId,

            userId:
              session.user.id,
          },

          select: {
            id: true,
          },
        }
      );

    if (!existingProject) {
      return NextResponse.json(
        {
          error:
            "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const title =
      typeof body.title ===
      "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description ===
      "string"
        ? body.description.trim()
        : "";

    const period =
      typeof body.period ===
      "string"
        ? body.period.trim()
        : "";

    if (
      !title ||
      !description ||
      !period
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.update(
        {
          where: {
            id:
              existingProject.id,
          },

          data: {
            title,
            description,
            period,
          },
        }
      );

    return NextResponse.json(
      project
    );
  } catch (error) {
    console.error(
      "PUT project error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update project",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * =========================================================
 * DELETE PROJECT
 * =========================================================
 */
export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    const projectId =
      Number(id);

    if (
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid project id",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * SECURITY:
     * المشروع يجب أن يكون مملوكًا للمستخدم الحالي.
     *
     * نحصل أيضًا على URLs الخاصة بالمستندات
     * قبل حذف سجلاتها من قاعدة البيانات.
     * =====================================================
     */

    const existingProject =
      await prisma.project.findFirst(
        {
          where: {
            id: projectId,

            userId:
              session.user.id,
          },

          select: {
            id: true,

            documents: {
              select: {
                id: true,
                url: true,
              },
            },
          },
        }
      );

    if (!existingProject) {
      return NextResponse.json(
        {
          error:
            "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * نحتفظ بمسارات الملفات في الذاكرة
     * قبل حذف سجلات المستندات.
     */
    const documentUrls =
      existingProject.documents
        .map(
          (document) =>
            document.url
        )
        .filter(
          (
            url
          ): url is string =>
            typeof url ===
              "string" &&
            url.trim().length > 0
        );

    /*
     * =====================================================
     * حذف بيانات المشروع من قاعدة البيانات.
     * =====================================================
     */

    await prisma.$transaction([
      /*
       * حذف روابط الكيانات بالمشروع.
       */
      prisma.projectEntity.deleteMany(
        {
          where: {
            projectId:
              existingProject.id,
          },
        }
      ),

      /*
       * حذف المستندات.
       *
       * الأقسام التابعة للمستندات يفترض أن
       * تُحذف عبر Cascade كما في النظام الحالي.
       */
      prisma.document.deleteMany(
        {
          where: {
            projectId:
              existingProject.id,
          },
        }
      ),

      /*
       * حذف المشروع نفسه.
       */
      prisma.project.delete({
        where: {
          id:
            existingProject.id,
        },
      }),
    ]);

    /*
     * =====================================================
     * بعد نجاح قاعدة البيانات:
     * نحذف الملفات الفعلية.
     *
     * نستخدم Promise.allSettled حتى لو حدثت مشكلة
     * في ملف واحد لا تمنع محاولة حذف باقي الملفات.
     * =====================================================
     */

    await Promise.allSettled(
      documentUrls.map(
        (documentUrl) =>
          deletePhysicalFile(
            documentUrl
          )
      )
    );

    return NextResponse.json({
      success: true,

      deletedProjectId:
        existingProject.id,

      deletedDocuments:
        existingProject.documents
          .length,
    });
  } catch (error) {
    console.error(
      "DELETE project error:",
      error
    );

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