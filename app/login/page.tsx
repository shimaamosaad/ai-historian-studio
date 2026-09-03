"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("LOGIN_ERROR:", error);
      setError("تعذر تسجيل الدخول، حاولي مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-500/20 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-[0.35em] text-amber-400">
            ATHAR AI
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            تسجيل الدخول إلى أثر
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            أدخلي بيانات حسابك للمتابعة إلى منصة أثر
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              البريد الإلكتروني
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              dir="ltr"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left outline-none transition focus:border-amber-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              كلمة المرور
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              dir="ltr"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left outline-none transition focus:border-amber-500"
              placeholder="كلمة المرور"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ليس لديكِ حساب؟{" "}
          <Link
            href="/register"
            className="font-semibold text-amber-400 hover:text-amber-300"
          >
            إنشاء حساب
          </Link>
        </p>
      </div>
    </main>
  );
}
