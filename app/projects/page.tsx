"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProjectDocument = {
  id: number;
  processingStatus?: string | null;
};

type Project = {
  id: number;
  title: string;
  description?: string | null;
  period?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  domain?: string | null;
  domainId?: string | null;
  documents?: ProjectDocument[];
};

function getDomainLabel(domain?: string | null) {
  switch (domain) {
    case "history":
      return "التاريخ";

    case "archaeology":
      return "الآثار";

    case "literature":
      return "الأدب واللغة";

    case "islamic-studies":
      return "الدراسات الإسلامية";

    case "law":
      return "القانون";

    case "sociology":
      return "علم الاجتماع";

    case "psychology":
      return "علم النفس";

    case "geography":
      return "الجغرافيا";

    case "political-science":
      return "العلوم السياسية";

    case "economics":
      return "الاقتصاد";

    default:
      return "التاريخ";
  }
}

function getAnalysisStatus(documents: ProjectDocument[]) {
  if (documents.length === 0) {
    return {
      label: "لا توجد مستندات",
      className:
        "border-slate-500/20 bg-slate-500/10 text-slate-400",
    };
  }

  const hasProcessing = documents.some(
    (document) =>
      document.processingStatus === "PROCESSING" ||
      document.processingStatus === "PENDING"
  );

  if (hasProcessing) {
    return {
      label: "جاري التحليل",
      className:
        "border-amber-400/20 bg-amber-400/10 text-amber-300",
    };
  }

  const hasError = documents.some(
    (document) =>
      document.processingStatus === "FAILED" ||
      document.processingStatus === "ERROR"
  );

  if (hasError) {
    return {
      label: "يوجد خطأ",
      className:
        "border-red-400/20 bg-red-400/10 text-red-300",
    };
  }

  const completedDocuments = documents.filter(
    (document) =>
      document.processingStatus === "COMPLETED"
  );

  if (completedDocuments.length === documents.length) {
    return {
      label: "مكتمل",
      className:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    };
  }

  return {
    label: "جاهز",
    className:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProjectId, setDeletingProjectId] =
    useState<number | null>(null);
  const [error, setError] = useState("");

  async function fetchProjects() {
    try {
      setError("");

      const response = await fetch("/api/projects", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("فشل تحميل المشاريع");
      }

      const data = await response.json();

      setProjects(
        Array.isArray(data) ? data : []
      );
    } catch (fetchError) {
      console.error(fetchError);

      setError(
        "تعذر تحميل المشاريع. تأكدي أن الخادم يعمل ثم أعيدي المحاولة."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function deleteProject(
    event: React.MouseEvent<HTMLButtonElement>,
    projectId: number,
    title: string
  ) {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm(
      `هل تريدين حذف المشروع "${title}"؟ لا يمكن التراجع عن هذه الخطوة.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProjectId(projectId);

      const response = await fetch(
        `/api/projects/${projectId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("فشل حذف المشروع");
      }

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) =>
            project.id !== projectId
        )
      );
    } catch (deleteError) {
      console.error(deleteError);

      window.alert(
        "فشل حذف المشروع. حاولي مرة أخرى."
      );
    } finally {
      setDeletingProjectId(null);
    }
  }

  return (
    <main
      className="min-h-screen bg-slate-950 text-white"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        {/* Header */}

        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center text-sm text-slate-400 transition hover:text-cyan-300"
            >
              ← العودة إلى الصفحة الرئيسية
            </Link>

            <h1 className="text-3xl font-black sm:text-4xl">
              مشاريعي البحثية
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-400">
              يمكنك فتح مشاريعك السابقة، متابعة المستندات
              وحالة التحليل، أو إنشاء مشروع بحثي جديد.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            + مشروع جديد
          </Link>
        </div>

        {/* Summary */}

        {!loading && !error && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              title="إجمالي المشاريع"
              value={projects.length}
              icon="📚"
            />

            <SummaryCard
              title="المشاريع النشطة"
              value={
                projects.filter(
                  (project) =>
                    (project.documents?.length ?? 0) >
                    0
                ).length
              }
              icon="🔎"
            />

            <SummaryCard
              title="إجمالي المستندات"
              value={projects.reduce(
                (total, project) =>
                  total +
                  (project.documents?.length ?? 0),
                0
              )}
              icon="📄"
            />
          </div>
        )}

        {/* Loading */}

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-300" />

            <p className="mt-4 text-slate-400">
              جاري تحميل المشاريع...
            </p>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
            <p className="text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchProjects();
              }}
              className="mt-5 rounded-xl border border-red-300/20 px-5 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-300/10"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty state */}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-12 text-center">
              <div className="text-5xl">
                📁
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                لا توجد مشاريع حتى الآن
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
                ابدئي بإنشاء أول مشروع، ثم أضيفي إليه
                المستندات والمصادر التي تريدين تحليلها.
              </p>

              <Link
                href="/projects/new"
                className="mt-7 inline-flex rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                إنشاء أول مشروع
              </Link>
            </div>
          )}

        {/* Projects */}

        {!loading &&
          !error &&
          projects.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                const documents =
                  project.documents ?? [];

                const domain =
                  project.domainId ??
                  project.domain ??
                  "history";

                const status =
                  getAnalysisStatus(documents);

                return (
                  <article
                    key={project.id}
                    className="group relative flex min-h-[310px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-slate-900"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-300">
                        {getDomainLabel(domain)}
                      </div>

                      <button
                        type="button"
                        disabled={
                          deletingProjectId ===
                          project.id
                        }
                        onClick={(event) =>
                          deleteProject(
                            event,
                            project.id,
                            project.title
                          )
                        }
                        className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingProjectId ===
                        project.id
                          ? "جاري الحذف..."
                          : "حذف"}
                      </button>
                    </div>

                    <h2 className="text-xl font-bold leading-8 text-white transition group-hover:text-cyan-300">
                      {project.title}
                    </h2>

                    <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-400">
                      {project.description ||
                        "لا يوجد وصف لهذا المشروع."}
                    </p>

                    <div className="mt-5 space-y-3">
                      <ProjectInfo
                        icon="📜"
                        label="الفترة"
                        value={
                          project.period ||
                          "غير محددة"
                        }
                      />

                      <ProjectInfo
                        icon="📄"
                        label="المستندات"
                        value={`${documents.length} مستند`}
                      />

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-500">
                          حالة التحليل
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="mb-4 text-xs text-slate-500">
                        أُنشئ في{" "}
                        {new Date(
                          project.createdAt
                        ).toLocaleDateString(
                          "ar-EG",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </div>

                      <Link
                        href={`/projects/${project.id}`}
                        className="flex w-full items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 font-bold text-cyan-300 transition hover:bg-cyan-400/20"
                      >
                        فتح المشروع
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-300">
            {value}
          </p>
        </div>

        <div className="text-3xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProjectInfo({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] truncate text-left text-slate-300">
        {icon} {value}
      </span>
    </div>
  );
}