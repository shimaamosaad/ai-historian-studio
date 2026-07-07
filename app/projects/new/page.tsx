"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import AtharButton from "@/components/ui/AtharButton";
import AtharInput from "@/components/ui/AtharInput";
import { useState } from "react";

type ProjectForm = {
  title: string;
  description: string;
  period: string;
  region: string;
  language: string;
};

export default function NewProjectPage() {
  const { register, handleSubmit, reset } = useForm<ProjectForm>();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: ProjectForm) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        console.error("API Error:", body);
        throw new Error(body.error || "Failed to create project");
      }

      console.log("Created:", body);

      reset();

      router.push("/projects");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء إنشاء المشروع"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-5xl font-black">إنشاء مشروع جديد</h1>

          <p className="mt-4 text-slate-400">
            ابدأ مشروعًا جديدًا، ثم أضف الوثائق والمخطوطات ليبدأ أثر في تحليلها.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl"
        >
          <AtharInput
            label="اسم المشروع"
            placeholder="مثال: الحياة العلمية في العصر المملوكي"
            {...register("title", { required: true })}
          />

          <AtharInput
            label="وصف المشروع"
            placeholder="اكتب وصفًا مختصرًا للمشروع..."
            {...register("description", { required: true })}
          />

          <div className="grid gap-6 md:grid-cols-3">
            <AtharInput
              label="الفترة التاريخية"
              placeholder="العصر المملوكي"
              {...register("period", { required: true })}
            />

            <AtharInput
              label="الدولة أو الإقليم"
              placeholder="مصر"
              {...register("region", { required: true })}
            />

            <AtharInput
              label="لغة المصادر"
              placeholder="العربية"
              {...register("language", { required: true })}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex justify-end">
            <AtharButton type="submit" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء المشروع"}
            </AtharButton>
          </div>
        </form>
      </div>
    </main>
  );
}