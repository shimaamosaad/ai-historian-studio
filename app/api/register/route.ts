import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يحتوي على حرفين على الأقل")
    .max(100, "الاسم طويل جدًا"),

  email: z
    .string()
    .trim()
    .email("البريد الإلكتروني غير صحيح")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل")
    .max(100, "كلمة المرور طويلة جدًا"),
});

export async function POST(request: Request) {
  console.log("=== REGISTER ROUTE WITH SUBSCRIPTION IS RUNNING ===");

  try {
    const body = await request.json();

    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError =
        validationResult.error.issues[0]?.message ??
        "البيانات المدخلة غير صحيحة";

      return NextResponse.json(
        {
          error: firstError,
        },
        {
          status: 400,
        }
      );
    }

    const { name, email, password } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل",
        },
        {
          status: 409,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,

        subscription: {
          create: {
            plan: "FREE",
            monthlyLimit: 25,
            usedThisMonth: 0,
          },
        },
      },

      select: {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  subscription: {
    select: {
      id: true,
      plan: true,
      monthlyLimit: true,
      usedThisMonth: true,
    },
  },
},
    });

    console.log("========== USER CREATED ==========");
    console.log(JSON.stringify(user, null, 2));
    console.log("==================================");

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          subscription: user.subscription,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("REGISTER_API_ERROR:", error);

    return NextResponse.json(
      {
        error: "حدث خطأ أثناء إنشاء الحساب",
      },
      {
        status: 500,
      }
    );
  }
}