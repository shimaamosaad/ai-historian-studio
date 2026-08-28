import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getDocumentProxy } from "unpdf";
import * as mammoth from "mammoth";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkSubscription } from "@/lib/subscription/checkSubscription";

export const runtime = "nodejs";
export const maxDuration = 300;

const FREE_MAX_FILE_SIZE =
  50 * 1024 * 1024;

const PAID_MAX_FILE_SIZE =
  150 * 1024 * 1024;

type SubscriptionPlan =
  | "FREE"
  | "PRO"
  | "ENTERPRISE";

type SupportedDocumentType =
  | "pdf"
  | "docx";

function getMaxFileSize(
  plan: SubscriptionPlan
): number {
  return plan === "FREE"
    ? FREE_MAX_FILE_SIZE
    : PAID_MAX_FILE_SIZE;
}

function getMaxFileSizeLabel(
  plan: SubscriptionPlan
): string {
  return plan === "FREE"
    ? "50 ميجابايت"
    : "150 ميجابايت";
}

/*
 * =========================================================
 * File content validation
 * =========================================================
 */

/*
 * PDF files normally contain the "%PDF-" signature
 * near the beginning of the file.
 *
 * We check the first 1024 bytes instead of relying only
 * on the extension or browser MIME type.
 */
function hasPdfSignature(
  buffer: Buffer
): boolean {
  if (buffer.length < 5) {
    return false;
  }

  const header = buffer
    .subarray(
      0,
      Math.min(
        buffer.length,
        1024
      )
    )
    .toString(
      "latin1"
    );

  return header.includes(
    "%PDF-"
  );
}

/*
 * DOCX is internally a ZIP archive.
 *
 * ZIP files usually start with one of these
 * PK signatures.
 */
function hasZipSignature(
  buffer: Buffer
): boolean {
  if (buffer.length < 4) {
    return false;
  }

  const signature =
    buffer
      .subarray(0, 4)
      .toString("hex");

  return (
    signature ===
      "504b0304" ||
    signature ===
      "504b0506" ||
    signature ===
      "504b0708"
  );
}

/*
 * Validate that the uploaded PDF is actually
 * a readable PDF document.
 */
async function validatePdfContent(
  buffer: Buffer
): Promise<void> {
  if (
    !hasPdfSignature(
      buffer
    )
  ) {
    throw new Error(
      "محتوى الملف لا يطابق ملف PDF حقيقي"
    );
  }

  let pdf:
    | Awaited<
        ReturnType<
          typeof getDocumentProxy
        >
      >
    | null = null;

  try {
    pdf =
      await getDocumentProxy(
        new Uint8Array(
          buffer
        )
      );

    if (
      !Number.isInteger(
        pdf.numPages
      ) ||
      pdf.numPages <= 0
    ) {
      throw new Error(
        "PDF_HAS_NO_VALID_PAGES"
      );
    }
  } catch {
    throw new Error(
      "ملف PDF تالف أو غير صالح للقراءة"
    );
  } 
  }

/*
 * Validate that the uploaded DOCX is really
 * a readable Word OpenXML document.
 *
 * Checking ZIP alone is not enough because any ZIP
 * file could otherwise be renamed to .docx.
 *
 * mammoth attempts to read the actual DOCX structure.
 */
async function validateDocxContent(
  buffer: Buffer
): Promise<void> {
  if (
    !hasZipSignature(
      buffer
    )
  ) {
    throw new Error(
      "محتوى الملف لا يطابق ملف Word (.docx) حقيقي"
    );
  }

  try {
    await mammoth.extractRawText(
      {
        buffer,
      }
    );
  } catch {
    throw new Error(
      "ملف Word تالف أو ليس مستند DOCX صالحًا"
    );
  }
}

/*
 * Validate the real content of the uploaded file
 * and return the detected supported type.
 */
async function validateUploadedFile(
  buffer: Buffer,
  fileName: string
): Promise<SupportedDocumentType> {
  const extension =
    path
      .extname(fileName)
      .toLowerCase();

  if (
    extension === ".pdf"
  ) {
    await validatePdfContent(
      buffer
    );

    return "pdf";
  }

  if (
    extension === ".docx"
  ) {
    await validateDocxContent(
      buffer
    );

    return "docx";
  }

  throw new Error(
    "يتم دعم ملفات PDF أو Word (.docx) فقط"
  );
}

export async function POST(
  request: Request
) {
 let savedBlobUrl:
  | string
  | null = null;

  try {
    /*
     * =====================================================
     * Authentication
     * =====================================================
     */

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

    /*
     * =====================================================
     * Read request
     * =====================================================
     */

    const formData =
      await request.formData();

    const file =
      formData.get(
        "file"
      );

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

    /*
     * =====================================================
     * Basic file validation
     * =====================================================
     */

    if (
      file.size <= 0
    ) {
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

    const hasPdfExtension =
      lowerFileName.endsWith(
        ".pdf"
      );

    const hasDocxExtension =
      lowerFileName.endsWith(
        ".docx"
      );

    if (
      !hasPdfExtension &&
      !hasDocxExtension
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

    /*
     * =====================================================
     * Project ownership
     * =====================================================
     */

    const project =
      await prisma.project.findFirst(
        {
          where: {
            id: projectId,
            userId,
          },

          select: {
            id: true,
          },
        }
      );

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

    /*
     * =====================================================
     * Subscription validation
     * =====================================================
     */

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

    /*
     * =====================================================
     * Read file into memory
     * =====================================================
     */

    const fileBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    /*
     * =====================================================
     * SECURITY:
     * Validate REAL file content BEFORE writing anything
     * to storage.
     * =====================================================
     */

    let documentType:
      SupportedDocumentType;

    try {
      documentType =
        await validateUploadedFile(
          fileBuffer,
          file.name
        );
    } catch (
      validationError
    ) {
      return NextResponse.json(
        {
          error:
            validationError instanceof
            Error
              ? validationError.message
              : "الملف غير صالح",

          reason:
            "INVALID_FILE_CONTENT",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * Private storage
     * =====================================================
     *
     * Only now — after successful content validation —
     * do we create/save the file.
     */

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
  `document.${documentType}`;

const safeName =
  `${Date.now()}-${safeOriginalName}`;

const blobPath =
  `documents/${userId}/${safeName}`;

const blob =
  await put(
    blobPath,
    fileBuffer,
    {
      access: "private",
      addRandomSuffix: false,
      contentType:
        documentType === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
  );

const storedUrl =
  blob.url;

  savedBlobUrl =
  storedUrl;
    /*
     * =====================================================
     * Database
     * =====================================================
     */

    const document =
      await prisma.document.create(
        {
          data: {
            name:
              file.name,

           url:
  storedUrl,

            content:
              "",

            type:
              documentType,

            projectId,

            processingStatus:
              "QUEUED",

            processedPages:
              0,

            totalPages:
              0,

            billedPages:
              0,

            usageSource:
              null,

            usageChargedAt:
              null,

            processingError:
              null,
          },
        }
      );

    /*
     * Database record now exists successfully,
     * so catch() must no longer delete the file.
     */
    savedBlobUrl =
  null;

    /*
     * =====================================================
     * Response
     * =====================================================
     */

    return NextResponse.json(
      {
        message:
          "تم رفع المستند والتحقق من سلامة محتواه بنجاح. سيتم حساب عدد الصفحات والتحقق من رصيد المعالجة قبل بدء التحليل.",

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
    /*
     * =====================================================
     * Cleanup orphan file
     * =====================================================
     */

    if (savedBlobUrl) {
  try {
    await del(
      savedBlobUrl
    );
  } catch (deleteError) {
    console.error(
      "Failed to delete uploaded blob:",
      deleteError
    );
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