import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkSubscription } from "@/lib/subscription/checkSubscription";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 50 * 1024 * 1024;
class SubscriptionLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionLimitError";
  }
}

export async function POST(request: Request) {
  let savedFilePath: string | null = null;

  try {
    // التأكد من تسجيل الدخول
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول أولًا لرفع المستندات",
        },
        {
          status: 401,
        }
      );
    }

    const userId = (session.user as { id: string }).id;

    if (!userId) {
      return NextResponse.json(
        {
          error: "تعذر تحديد المستخدم الحالي",
        },
        {
          status: 401,
        }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const projectIdValue = formData.get("projectId");

    const projectId = Number(projectIdValue);

    if (
      !file ||
      typeof file === "string" ||
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      return NextResponse.json(
        {
          error: "الملف أو رقم المشروع غير صحيح",
        },
        {
          status: 400,
        }
      );
    }

    const lowerFileName = file.name.toLowerCase();

    const isPdf =
      file.type === "application/pdf" ||
      lowerFileName.endsWith(".pdf");

    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerFileName.endsWith(".docx");

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        {
          error: "يتم دعم ملفات PDF أو Word (.docx) فقط",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "حجم الملف أكبر من الحد المسموح وهو 50 ميجابايت",
        },
        {
          status: 400,
        }
      );
    }

    // التأكد أن المشروع موجود ومملوك للمستخدم الحالي
    const project = await prisma.project.findFirst({
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

    // فحص الاشتراك والحد الشهري والأرصدة الإضافية
    const subscriptionCheck = await checkSubscription(userId);

    if (!subscriptionCheck.allowed) {
      return NextResponse.json(
        {
          error:
            subscriptionCheck.message ??
            "لا يمكن رفع مستند جديد حاليًا",
          reason: subscriptionCheck.reason,
          subscription:
            subscriptionCheck.subscription ?? null,
        },
        {
          status: 429,
        }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await fs.mkdir(uploadDir, {
      recursive: true,
    });

    const safeOriginalName = file.name.replace(
      /[^\w.\-\u0600-\u06FF]+/gu,
      "-"
    );

    const safeName = `${Date.now()}-${safeOriginalName}`;

    const filePath = path.join(uploadDir, safeName);

    const fileBuffer = Buffer.from(
      await file.arrayBuffer()
    );

    await fs.writeFile(filePath, fileBuffer);

    savedFilePath = filePath;

    // إنشاء المستند والخصم من الحد الشهري أو الرصيد الإضافي
    const result = await prisma.$transaction(
      async (transaction) => {
        const currentSubscription =
          await transaction.subscription.findUnique({
            where: {
              userId,
            },
          });

        if (!currentSubscription) {
          throw new Error(
            "لا يوجد اشتراك مرتبط بهذا الحساب."
          );
        }

        const now = new Date();

        if (
          currentSubscription.expiresAt &&
          currentSubscription.expiresAt <= now
        ) {
          throw new Error(
            "انتهت صلاحية الاشتراك. يرجى تجديد الاشتراك للمتابعة."
          );
        }

        const monthlyLimitReached =
          currentSubscription.usedThisMonth >=
          currentSubscription.monthlyLimit;

        let updatedSubscription;
        let usageSource: "MONTHLY" | "EXTRA_CREDIT";

        if (!monthlyLimitReached) {
          // الخصم من الحد الشهري
          updatedSubscription =
            await transaction.subscription.update({
              where: {
                userId,
              },
              data: {
                usedThisMonth: {
                  increment: 1,
                },
              },
            });

          usageSource = "MONTHLY";
        } else if (currentSubscription.extraCredits > 0) {
          // الخصم من الأرصدة الإضافية
          // Do not rely solely on the value read above: another upload may
          // consume the last credit before this transaction reaches here.
          const creditDeduction =
            await transaction.subscription.updateMany({
              where: {
                userId,
                extraCredits: {
                  gt: 0,
                },
              },
              data: {
                extraCredits: {
                  decrement: 1,
                },
              },
            });

          if (creditDeduction.count !== 1) {
            throw new Error(
              "تم استهلاك الرصيد الإضافي بواسطة عملية رفع أخرى. يُرجى المحاولة مرة أخرى."
            );
          }

          updatedSubscription =
            await transaction.subscription.findUniqueOrThrow({
              where: {
                userId,
              },
            });

          usageSource = "EXTRA_CREDIT";
        } else {
          throw new SubscriptionLimitError(
  "لقد استهلكت الحد الشهري والأرصدة الإضافية. يرجى شراء رصيد إضافي أو ترقية خطتك."
);
        }

        const document =
          await transaction.document.create({
            data: {
              name: file.name,
              url: `/uploads/${safeName}`,
              content: "",
              type: isPdf ? "pdf" : "docx",
              projectId,
              processingStatus: "QUEUED",
              processedPages: 0,
              totalPages: 0,
              processingError: null,
            },
          });

        return {
          document,
          updatedSubscription,
          usageSource,
        };
      }
    );

    savedFilePath = null;

    const remainingFiles = Math.max(
      result.updatedSubscription.monthlyLimit -
        result.updatedSubscription.usedThisMonth,
      0
    );

    const totalRemainingFiles =
      remainingFiles +
      result.updatedSubscription.extraCredits;

    console.log(
      "========== SUBSCRIPTION UPDATED =========="
    );
    console.log("User ID:", userId);
    console.log(
      "Used This Month:",
      result.updatedSubscription.usedThisMonth
    );
    console.log(
      "Extra Credits:",
      result.updatedSubscription.extraCredits
    );
    console.log("Remaining Monthly Files:", remainingFiles);
    console.log(
      "Total Remaining Files:",
      totalRemainingFiles
    );
    console.log("Usage Source:", result.usageSource);
    console.log(
      "=========================================="
    );

    return NextResponse.json(
      {
        message:
          result.usageSource === "MONTHLY"
            ? "تم رفع المستند وخصمه من الحد الشهري وبدأت معالجته"
            : "تم رفع المستند وخصمه من الرصيد الإضافي وبدأت معالجته",
        document: result.document,
        subscription: {
          plan: result.updatedSubscription.plan,
          monthlyLimit:
            result.updatedSubscription.monthlyLimit,
          usedThisMonth:
            result.updatedSubscription.usedThisMonth,
          remainingFiles,
          extraCredits:
            result.updatedSubscription.extraCredits,
          totalRemainingFiles,
          usageSource: result.usageSource,
        },
      },
      {
        status: 202,
      }
    );
  } catch (error) {
    // حذف الملف إذا فشل الحفظ في قاعدة البيانات
    if (savedFilePath) {
      try {
        await fs.unlink(savedFilePath);
      } catch (deleteError) {
        if (error instanceof SubscriptionLimitError) {
  return NextResponse.json(
    {
      error: error.message,
      reason: "MONTHLY_LIMIT_REACHED",
    },
    {
      status: 429,
    }
  );
}
        console.error(
          "Failed to delete uploaded file:",
          deleteError
        );
      }
    }

    console.error("Document upload error:", error);

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
