import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkSubscription } from "@/lib/subscription/checkSubscription";

export const runtime = "nodejs";
export const maxDuration = 300;

const FREE_MAX_FILE_SIZE =
  50 * 1024 * 1024;

const PAID_MAX_FILE_SIZE =
  150 * 1024 * 1024;

function getMaxFileSize(
  plan: "FREE" | "PRO" | "ENTERPRISE"
): number {
  return plan === "FREE"
    ? FREE_MAX_FILE_SIZE
    : PAID_MAX_FILE_SIZE;
}

function getMaxFileSizeLabel(
  plan: "FREE" | "PRO" | "ENTERPRISE"
): string {
  return plan === "FREE"
    ? "50 ميجابايت"
    : "150 ميجابايت";
}

export async function POST(
  request: Request
) {
  let savedFilePath:
    | string
    | null = null;

  try {
    const session =
      await auth();

    if (
      !session?.user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول أولًا لرفع المستندات",
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      session.user.id;

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    const projectIdValue =
      formData.get(
        "projectId"
      );

    const projectId =
      Number(
        projectIdValue
      );

    if (
      !file ||
      typeof file ===
        "string" ||
      !Number.isInteger(
        projectId
      ) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "الملف أو رقم المشروع غير صحيح",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error:
            "الملف المرفوع فارغ",
        },
        {
          status: 400,
        }
      );
    }

    const lowerFileName =
      file.name.toLowerCase();

    const isPdf =
      file.type ===
        "application/pdf" ||
      lowerFileName.endsWith(
        ".pdf"
      );

    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerFileName.endsWith(
        ".docx"
      );

    if (
      !isPdf &&
      !isDocx
    ) {
      return NextResponse.json(
        {
          error:
            "يتم دعم ملفات PDF أو Word (.docx) فقط",
        },
        {
          status: 400,
        }
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          userId,
        },
        select: {
          id: true,
        },
      });

    if (!project) {
      return NextResponse.json(
        {
          error:
            "المشروع غير موجود أو ليس لديك صلاحية رفع مستندات إليه",
        },
        {
          status: 404,
        }
      );
    }

    const subscriptionCheck =
      await checkSubscription(
        userId
      );

    if (
      !subscriptionCheck.allowed
    ) {
      return NextResponse.json(
        {
          error:
            subscriptionCheck.message ??
            "لا يمكن رفع مستند جديد حاليًا",
          reason:
            subscriptionCheck.reason,
          subscription:
            subscriptionCheck.subscription ??
            null,
        },
        {
          status: 429,
        }
      );
    }

    const subscription =
      subscriptionCheck.subscription;

    const maxFileSize =
      getMaxFileSize(
        subscription.plan
      );

    if (
      file.size >
      maxFileSize
    ) {
      return NextResponse.json(
        {
          error:
            `حجم الملف أكبر من الحد المسموح لباقة ${subscription.plan}. الحد الحالي هو ${getMaxFileSizeLabel(
              subscription.plan
            )}.`,
          reason:
            "FILE_SIZE_LIMIT_REACHED",
          maxFileSizeBytes:
            maxFileSize,
        },
        {
          status: 400,
        }
      );
    }

    const uploadDir =
      path.join(
        process.cwd(),
        "public",
        "uploads"
      );

    await fs.mkdir(
      uploadDir,
      {
        recursive: true,
      }
    );

    const safeOriginalName =
      file.name
        .replace(
          /[^\w.\-\u0600-\u06FF]+/gu,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        ) ||
      "document";

    const safeName =
      `${Date.now()}-${safeOriginalName}`;

    const filePath =
      path.join(
        uploadDir,
        safeName
      );

    const fileBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    await fs.writeFile(
      filePath,
      fileBuffer
    );

    savedFilePath =
      filePath;

    const document =
      await prisma.document.create({
        data: {
          name:
            file.name,
          url:
            `/uploads/${safeName}`,
          content: "",
          type:
            isPdf
              ? "pdf"
              : "docx",
          projectId,
          processingStatus:
            "QUEUED",
          processedPages: 0,
          totalPages: 0,
          billedPages: 0,
          usageSource: null,
          usageChargedAt:
            null,
          processingError:
            null,
        },
      });

    savedFilePath = null;

    return NextResponse.json(
      {
        message:
          "تم رفع المستند بنجاح. سيتم حساب عدد الصفحات والتحقق من رصيد المعالجة قبل بدء التحليل.",

        document,

        limits: {
          maxFileSizeBytes:
            maxFileSize,
          maxFileSizeLabel:
            getMaxFileSizeLabel(
              subscription.plan
            ),
        },

        subscription: {
          plan:
            subscription.plan,
          pageLimit:
            subscription.pageLimit,
          usedPages:
            subscription.usedPages,
          remainingPages:
            subscription.remainingPages,
          extraPages:
            subscription.extraPages,
          totalRemainingPages:
            subscription.totalRemainingPages,
          questionLimit:
            subscription.questionLimit,
          usedQuestions:
            subscription.usedQuestions,
          remainingQuestions:
            subscription.remainingQuestions,
          extraQuestions:
            subscription.extraQuestions,
          totalRemainingQuestions:
            subscription.totalRemainingQuestions,
        },

        usage: {
          charged: false,
          billedPages: 0,
          usageSource: null,
        },
      },
      {
        status: 202,
      }
    );
  } catch (error) {
    if (savedFilePath) {
      try {
        await fs.unlink(
          savedFilePath
        );
      } catch (
        deleteError
      ) {
        const fileError =
          deleteError as {
            code?: string;
          };

        if (
          fileError.code !==
          "ENOENT"
        ) {
          console.error(
            "Failed to delete uploaded file:",
            deleteError
          );
        }
      }
    }

    console.error(
      "Document upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء رفع المستند",
      },
      {
        status: 500,
      }
    );
  }
}