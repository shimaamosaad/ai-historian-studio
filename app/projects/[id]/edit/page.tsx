"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import AtharButton from "@/components/ui/AtharButton";
import AtharInput from "@/components/ui/AtharInput";

type ProjectForm = {
  title: string;
  description: string;
  period: string;
};

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();

  const projectId = params.id;

  const { register, handleSubmit, reset } = useForm<ProjectForm>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch("/api/projects");

        if (!res.ok) {
          throw new Error();
        }

        const projects = await res.json();

        const project = projects.find(
          (p: any) => p.id === Number(projectId)
        );

        if (!project) {
          setError("المشروع غير موجود");
          return;
        }

        reset({
          title: project.title,
          description: project.description,
          period: project.period,
        });
      } catch {
        setError("تعذر تحميل المشروع");
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId, reset]);

  const onSubmit = async (data: ProjectForm) => {
    try {
      setSaving(true);

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error();
      }

      router.push(`/projects/${projectId}`);
    } catch {
      setError("فشل تحديث المشروع");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        جاري التحميل...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-5xl font-black mb-10">
          تعديل المشروع
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 rounded-3xl border border-white/10 bg-slate-900/60 p-8"
        >
          <AtharInput label="اسم المشروع" {...register("title")} />

          <AtharInput label="وصف المشروع" {...register("description")} />

          <div className="grid gap-6 md:grid-cols-2">
            <AtharInput
              label="الفترة التاريخية"
              {...register("period")}
            />
          </div>

          {error && <p className="text-red-400">{error}</p>}

          <div className="flex justify-end">
            <AtharButton type="submit" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </AtharButton>
          </div>
        </form>
      </div>
    </main>
  );
}