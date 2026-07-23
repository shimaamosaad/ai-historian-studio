"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderOpen,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

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

type AnalysisStatus = {
  label: string;
  className: string;
  dotClassName: string;
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

function getAnalysisStatus(
  documents: ProjectDocument[]
): AnalysisStatus {
  if (documents.length === 0) {
    return {
      label: "لا توجد مستندات",
      className:
        "border-slate-500/20 bg-slate-500/10 text-slate-400",
      dotClassName: "bg-slate-500",
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
      dotClassName: "animate-pulse bg-amber-300",
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
      dotClassName: "bg-red-300",
    };
  }

  const completedDocuments = documents.filter(
    (document) =>
      document.processingStatus === "COMPLETED"
  );

  if (
    documents.length > 0 &&
    completedDocuments.length === documents.length
  ) {
    return {
      label: "مكتمل",
      className:
        "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      dotClassName: "bg-emerald-300",
    };
  }

  return {
    label: "جاهز",
    className:
      "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    dotClassName: "bg-cyan-300",
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProjectId, setDeletingProjectId] =
    useState<number | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

      setProjects(Array.isArray(data) ? data : []);
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

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLocaleLowerCase("ar");

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) => {
      const searchableText = [
        project.title,
        project.description,
        project.period,
        getDomainLabel(
          project.domainId ??
            project.domain ??
            "history"
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ar");

      return searchableText.includes(normalizedQuery);
    });
  }, [projects, searchQuery]);

  const totalDocuments = useMemo(
    () =>
      projects.reduce(
        (total, project) =>
          total + (project.documents?.length ?? 0),
        0
      ),
    [projects]
  );

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          (project.documents?.length ?? 0) > 0
      ).length,
    [projects]
  );

  const completedProjects = useMemo(
    () =>
      projects.filter((project) => {
        const documents = project.documents ?? [];

        if (documents.length === 0) {
          return false;
        }

        return documents.every(
          (document) =>
            document.processingStatus === "COMPLETED"
        );
      }).length,
    [projects]
  );

  async function deleteProject(
    event: MouseEvent<HTMLButtonElement>,
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
          (project) => project.id !== projectId
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
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#020611] text-white"
    >
      {/* Background effects */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-180px] top-[-160px] h-[480px] w-[480px] rounded-full bg-blue-600/[0.10] blur-[140px]" />

        <div className="absolute bottom-[5%] left-[-180px] h-[420px] w-[420px] rounded-full bg-amber-400/[0.06] blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Top navigation */}

        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400/10 text-amber-300">
              <BookOpen className="h-5 w-5" />
            </span>

            <span>
              <span className="block text-xl font-black">
                أثر
              </span>

              <span className="block text-[10px] font-bold tracking-[0.18em] text-blue-300">
                AI HISTORIAN
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-blue-300/30 hover:bg-blue-400/[0.06] hover:text-blue-200"
          >
            <ArrowLeft className="h-4 w-4" />
            الصفحة الرئيسية
          </Link>
        </div>

        {/* Hero header */}

        <section className="relative overflow-hidden rounded-[28px] border border-blue-400/15 bg-gradient-to-l from-blue-950/70 via-slate-950/90 to-slate-950 p-7 shadow-2xl shadow-blue-950/20 sm:p-9 lg:p-11">
          <div className="pointer-events-none absolute left-[-80px] top-[-100px] h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/[0.08] px-4 py-2 text-xs font-bold text-amber-200">
                <Sparkles className="h-4 w-4" />
                مساحة العمل البحثية
              </div>

              <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                مشاريعي{" "}
                <span className="bg-gradient-to-l from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  البحثية
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-400 sm:text-base">
                أَديري مشروعاتك، وارفعي المصادر والوثائق،
                وتابعي عمليات التحليل واستخراج المعرفة من
                مكان واحد.
              </p>
            </div>

            <Link
              href="/projects/new"
              className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-2xl bg-gradient-to-l from-blue-500 to-cyan-400 px-6 py-4 font-black text-slate-950 shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-blue-500/30"
            >
              <Plus className="h-5 w-5 transition group-hover:rotate-90" />
              إنشاء مشروع جديد
            </Link>
          </div>
        </section>

        {/* Statistics */}

        {!loading && !error && (
          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="إجمالي المشروعات"
              value={projects.length}
              description="كل المشروعات المسجلة"
              icon={<FolderOpen className="h-6 w-6" />}
              iconClassName="border-blue-400/20 bg-blue-400/10 text-blue-300"
            />

            <SummaryCard
              title="المشروعات النشطة"
              value={activeProjects}
              description="تحتوي على مستندات"
              icon={<Sparkles className="h-6 w-6" />}
              iconClassName="border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
            />

            <SummaryCard
              title="إجمالي المستندات"
              value={totalDocuments}
              description="ملفات ومصادر بحثية"
              icon={<FileText className="h-6 w-6" />}
              iconClassName="border-amber-400/20 bg-amber-400/10 text-amber-300"
            />

            <SummaryCard
              title="التحليل المكتمل"
              value={completedProjects}
              description="مشروعات جاهزة للمراجعة"
              icon={<CheckCircle2 className="h-6 w-6" />}
              iconClassName="border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            />
          </section>
        )}

        {/* Search */}

        {!loading &&
          !error &&
          projects.length > 0 && (
            <section className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-lg">
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="ابحثي باسم المشروع أو المجال أو الفترة..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pr-12 pl-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/40 focus:ring-4 focus:ring-blue-400/[0.06]"
                  />
                </div>

                <p className="text-sm text-slate-500">
                  عرض{" "}
                  <span className="font-bold text-blue-300">
                    {filteredProjects.length}
                  </span>{" "}
                  من{" "}
                  <span className="font-bold text-white">
                    {projects.length}
                  </span>{" "}
                  مشروع
                </p>
              </div>
            </section>
          )}

        {/* Loading */}

        {loading && (
          <div className="mt-8 rounded-[28px] border border-white/10 bg-slate-900/50 p-12 text-center backdrop-blur-xl">
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-blue-300" />

            <p className="mt-5 font-semibold text-slate-300">
              جاري تحميل المشروعات...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              لحظات ونجهز مساحة العمل الخاصة بك
            </p>
          </div>
        )}

        {/* Error */}

        {!loading && error && (
          <div className="mt-8 rounded-[28px] border border-red-400/20 bg-red-400/[0.05] p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
              <RefreshCw className="h-6 w-6" />
            </div>

            <h2 className="mt-5 text-xl font-black text-red-200">
              تعذر تحميل المشروعات
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-red-200/70">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchProjects();
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/15"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty state */}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div className="mt-8 overflow-hidden rounded-[28px] border border-dashed border-blue-300/20 bg-gradient-to-b from-blue-500/[0.05] to-transparent p-10 text-center sm:p-14">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-300/20 bg-blue-400/10 text-blue-300">
                <FolderOpen className="h-9 w-9" />
              </div>

              <h2 className="mt-6 text-2xl font-black sm:text-3xl">
                ابدئي أول مشروع بحثي
              </h2>

              <p className="mx-auto mt-4 max-w-xl leading-8 text-slate-400">
                أنشئي مشروعًا، وحددي مجاله وفترته
                التاريخية، ثم أضيفي الوثائق والمصادر التي
                تريدين تحليلها.
              </p>

              <Link
                href="/projects/new"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-blue-500 to-cyan-400 px-6 py-3.5 font-black text-slate-950 transition hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                إنشاء أول مشروع
              </Link>
            </div>
          )}

        {/* No search results */}

        {!loading &&
          !error &&
          projects.length > 0 &&
          filteredProjects.length === 0 && (
            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.025] p-10 text-center">
              <Search className="mx-auto h-10 w-10 text-slate-600" />

              <h2 className="mt-5 text-xl font-black">
                لا توجد نتائج مطابقة
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                جرّبي كتابة اسم آخر أو احذفي كلمة البحث.
              </p>

              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-5 rounded-xl border border-blue-400/20 bg-blue-400/10 px-5 py-2.5 text-sm font-bold text-blue-200 transition hover:bg-blue-400/15"
              >
                مسح البحث
              </button>
            </div>
          )}

        {/* Projects grid */}

        {!loading &&
          !error &&
          filteredProjects.length > 0 && (
            <section className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">
                    أحدث المشروعات
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    افتحي أي مشروع لمتابعة الوثائق
                    والتحليل
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => {
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
                      className="group relative flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-white/[0.09] bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 shadow-xl shadow-black/10 transition duration-300 hover:-translate-y-1.5 hover:border-blue-400/30 hover:shadow-blue-950/30"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent opacity-0 transition group-hover:opacity-100" />

                      <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-500/[0.06] blur-3xl transition group-hover:bg-blue-500/[0.10]" />

                      <div className="relative flex items-start justify-between gap-4">
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-400/[0.08] px-3 py-1.5 text-xs font-bold text-blue-200">
                          <BookOpen className="h-3.5 w-3.5" />
                          {getDomainLabel(domain)}
                        </span>

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
                          aria-label={`حذف مشروع ${project.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/[0.06] text-red-300 transition hover:border-red-400/30 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingProjectId ===
                          project.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="relative mt-6">
                        <h3 className="line-clamp-2 text-xl font-black leading-8 text-white transition group-hover:text-blue-200">
                          {project.title}
                        </h3>

                        <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-400">
                          {project.description ||
                            "لا يوجد وصف مضاف لهذا المشروع حتى الآن."}
                        </p>
                      </div>

                      <div className="relative mt-6 space-y-3 rounded-2xl border border-white/[0.06] bg-black/10 p-4">
                        <ProjectInfo
                          icon={
                            <CalendarDays className="h-4 w-4" />
                          }
                          label="الفترة"
                          value={
                            project.period ||
                            "غير محددة"
                          }
                        />

                        <ProjectInfo
                          icon={
                            <FileText className="h-4 w-4" />
                          }
                          label="المستندات"
                          value={`${documents.length} مستند`}
                        />

                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-slate-500">
                            حالة التحليل
                          </span>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
                            />

                            {status.label}
                          </span>
                        </div>
                      </div>

                      <div className="relative mt-auto pt-6">
                        <p className="mb-4 text-xs text-slate-600">
                          أُنشئ في{" "}
                          {formatDate(
                            project.createdAt
                          )}
                        </p>

                        <Link
                          href={`/projects/${project.id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/20 bg-blue-400/[0.09] px-4 py-3 font-black text-blue-200 transition hover:border-blue-300/35 hover:bg-blue-400/[0.15]"
                        >
                          فتح المشروع
                          <ArrowLeft className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  iconClassName,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 backdrop-blur-xl transition hover:border-blue-300/20 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-600">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-105 ${iconClassName}`}
        >
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
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="flex max-w-[65%] items-center gap-2 truncate text-left font-semibold text-slate-300">
        <span className="shrink-0 text-blue-300">
          {icon}
        </span>

        <span className="truncate">
          {value}
        </span>
      </span>
    </div>
  );
}