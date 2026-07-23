"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import AtharButton from "@/components/ui/AtharButton";
import AtharInput from "@/components/ui/AtharInput";
import ResearchDomainSelector from "@/components/domains/ResearchDomainSelector";

import type { ResearchDomain } from "@/lib/domains/domainConfig";

type ProjectForm = {
  title: string;
  description: string;
  period: string;
  region: string;
  language: string;
};

export default function NewProjectPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectForm>({
    defaultValues: {
      title: "",
      description: "",
      period: "",
      region: "",
      language: "",
    },
  });

  const [selectedDomain, setSelectedDomain] =
    useState<ResearchDomain["id"]>("history");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: ProjectForm) => {
    try {
      setLoading(true);
      setError(null);

      /*
       * المجال المتاح حاليًا هو التاريخ فقط.
       * لا نرسل المجال إلى قاعدة البيانات حتى لا نعدل
       * Prisma أو واجهة API الحالية.
       */
      if (selectedDomain !== "history") {
        throw new Error(
          "هذا المجال قيد التطوير وغير متاح حاليًا."
        );
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        /*
         * نحافظ على شكل البيانات الحالي كما هو
         * حتى لا تتأثر قاعدة البيانات أو API.
         */
        body: JSON.stringify(data),
      });

      const body = await response.json();

      if (!response.ok) {
        console.error("API Error:", body);

        throw new Error(
          body.error || "تعذر إنشاء المشروع."
        );
      }

      reset();
      setSelectedDomain("history");

      router.push(`/projects/${body.id}`);
      router.refresh();
    } catch (submitError) {
      console.error(submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "حدث خطأ أثناء إنشاء المشروع."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#020611] text-white"
    >
      {/* Background */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-180px] top-[-170px] h-[500px] w-[500px] rounded-full bg-blue-600/[0.12] blur-[150px]" />

        <div className="absolute bottom-[-180px] left-[-150px] h-[450px] w-[450px] rounded-full bg-amber-400/[0.07] blur-[150px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Top navigation */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/10 text-xl text-amber-300">
              📖
            </span>

            <span>
              <span className="block text-xl font-black text-white">
                أثر
              </span>

              <span className="block text-[10px] font-bold tracking-[0.18em] text-blue-300">
                AI HISTORIAN
              </span>
            </span>
          </Link>

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-blue-300/30 hover:bg-blue-400/[0.06] hover:text-blue-200"
          >
            <span>←</span>
            العودة إلى المشروعات
          </Link>
        </div>

        {/* Header */}

        <section className="relative mb-8 overflow-hidden rounded-[28px] border border-blue-400/15 bg-gradient-to-l from-blue-950/70 via-slate-950/90 to-slate-950 px-7 py-9 shadow-2xl shadow-blue-950/20 sm:px-10 sm:py-11">
          <div className="pointer-events-none absolute left-[-80px] top-[-100px] h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/[0.08] px-4 py-2 text-xs font-bold text-amber-200">
              <span>✦</span>
              مشروع بحثي جديد
            </div>

            <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              أنشئ مساحة جديدة{" "}
              <span className="bg-gradient-to-l from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                للبحث والتحليل
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">
              حدد المجال ومعلومات المشروع الأساسية، وبعد
              إنشائه يمكن رفع الوثائق والمصادر وبدء التحليل
              واستخراج المعرفة.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-7"
          noValidate
        >
          {/* Domain selector */}

          <section className="rounded-[28px] border border-white/[0.09] bg-slate-900/60 p-6 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-8">
            <div className="mb-7 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-xl">
                🧭
              </div>

              <div>
                <h2 className="text-xl font-black sm:text-2xl">
                  المجال البحثي
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  اختر المجال الأقرب إلى موضوع المشروع.
                  التاريخ هو المجال المتاح حاليًا، وستضاف
                  المجالات الأخرى في مراحل لاحقة.
                </p>
              </div>
            </div>

            <ResearchDomainSelector
              value={selectedDomain}
              onChange={(domain) => {
                setSelectedDomain(domain.id);
                setError(null);
              }}
            />

            {selectedDomain !== "history" && (
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-5 py-4 text-sm leading-7 text-amber-200">
                هذا المجال ظاهر ضمن خطة المنصة، لكنه غير
                متاح للاستخدام في النسخة الحالية. اختر مجال
                التاريخ لإنشاء المشروع.
              </div>
            )}
          </section>

          {/* Project details */}

          <section className="rounded-[28px] border border-white/[0.09] bg-slate-900/60 p-6 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-xl">
                📝
              </div>

              <div>
                <h2 className="text-xl font-black sm:text-2xl">
                  بيانات المشروع
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  أدخل المعلومات الأساسية التي تساعد في
                  تعريف المشروع وتنظيم مصادره.
                </p>
              </div>
            </div>

            <div className="space-y-7">
              <div>
                <AtharInput
                  label="اسم المشروع"
                  placeholder="مثال: الحياة العلمية في العصر المملوكي"
                  disabled={loading}
                  {...register("title", {
                    required: "اسم المشروع مطلوب.",
                    minLength: {
                      value: 3,
                      message:
                        "اسم المشروع يجب أن يتكون من 3 أحرف على الأقل.",
                    },
                  })}
                />

                {errors.title && (
                  <p className="mt-2 text-sm text-red-300">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <AtharInput
                  label="وصف المشروع"
                  placeholder="اكتب وصفًا مختصرًا لموضوع المشروع وأهدافه..."
                  disabled={loading}
                  {...register("description", {
                    required: "وصف المشروع مطلوب.",
                    minLength: {
                      value: 10,
                      message:
                        "أضف وصفًا أوضح يتكون من 10 أحرف على الأقل.",
                    },
                  })}
                />

                {errors.description && (
                  <p className="mt-2 text-sm text-red-300">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <AtharInput
                    label="الفترة التاريخية"
                    placeholder="مثال: العصر المملوكي"
                    disabled={loading}
                    {...register("period", {
                      required:
                        "الفترة التاريخية مطلوبة.",
                    })}
                  />

                  {errors.period && (
                    <p className="mt-2 text-sm text-red-300">
                      {errors.period.message}
                    </p>
                  )}
                </div>

                <div>
                  <AtharInput
                    label="الدولة أو الإقليم"
                    placeholder="مثال: مصر"
                    disabled={loading}
                    {...register("region", {
                      required:
                        "الدولة أو الإقليم مطلوب.",
                    })}
                  />

                  {errors.region && (
                    <p className="mt-2 text-sm text-red-300">
                      {errors.region.message}
                    </p>
                  )}
                </div>

                <div>
                  <AtharInput
                    label="لغة المصادر"
                    placeholder="مثال: العربية"
                    disabled={loading}
                    {...register("language", {
                      required:
                        "لغة المصادر مطلوبة.",
                    })}
                  />

                  {errors.language && (
                    <p className="mt-2 text-sm text-red-300">
                      {errors.language.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Information note */}

          <section className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.05] px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg">💡</span>

              <p className="text-sm leading-7 text-slate-400">
                بعد إنشاء المشروع ستنتقل إلى صفحته مباشرة،
                ومن هناك يمكن رفع ملفات PDF والمستندات،
                ومتابعة التحليل، والتقرير، والتسلسل الزمني،
                والشبكة المعرفية.
              </p>
            </div>
          </section>

          {/* Error */}

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-5 py-4 text-sm leading-7 text-red-200"
            >
              {error}
            </div>
          )}

          {/* Actions */}

          <section className="flex flex-col-reverse gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/projects"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
            >
              إلغاء والعودة
            </Link>

            <div className="sm:min-w-[220px]">
              <AtharButton
                type="submit"
                disabled={
                  loading || selectedDomain !== "history"
                }
              >
                {loading
                  ? "جاري إنشاء المشروع..."
                  : "إنشاء المشروع"}
              </AtharButton>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}