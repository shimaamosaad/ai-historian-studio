import DeleteDocumentButton from "@/components/documents/DeleteDocumentButton";
import DocumentQuestion from "@/components/documents/DocumentQuestion";
import ProjectDocuments from "@/components/documents/ProjectDocuments";
import HistoricalReport from "@/components/projects/HistoricalReport";
import HistoricalTimeline from "@/components/projects/HistoricalTimeline";
import Link from "next/link";
import ProjectAIAnalysis from "./ProjectAIAnalysis";

export const dynamic = "force-dynamic";

async function getProject(id: string) {
  const res = await fetch(`http://localhost:3000/api/projects/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

function formatDate(value?: string) {
  if (!value) return "غير متوفر";

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getStatus(status?: string | null) {
  if (status === "PROCESSING" || status === "PENDING") {
    return {
      label:
        status === "PENDING"
          ? "في انتظار التحليل"
          : "جاري التحليل",
      badge:
        "border-amber-400/25 bg-amber-400/10 text-amber-300",
      dot:
        status === "PROCESSING"
          ? "animate-pulse bg-amber-400"
          : "bg-amber-400",
    };
  }

  if (status === "FAILED" || status === "ERROR") {
    return {
      label: "فشل التحليل",
      badge:
        "border-red-400/25 bg-red-400/10 text-red-300",
      dot: "bg-red-400",
    };
  }

  if (status === "COMPLETED" || !status) {
    return {
      label: "مكتمل",
      badge:
        "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
      dot: "bg-emerald-400",
    };
  }

  return {
    label: "جاهز",
    badge:
      "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    dot: "bg-cyan-400",
  };
}

function EntityGroup({
  title,
  icon,
  type,
  items,
}: {
  title: string;
  icon: string;
  type: string;
  items: any[];
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0a1727]/90 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-xl">
            {icon}
          </span>
          <h3 className="text-lg font-black">{title}</h3>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-400">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">
          لا توجد بيانات حتى الآن
        </p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((item: any) => (
            <Link
              key={item.entity.id}
              href={`/entities/${type}/${item.entity.slug}`}
              className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/25 hover:bg-amber-400/[0.06] hover:text-amber-200"
            >
              <span>{item.entity.name}</span>
              <span className="text-slate-600">←</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#030914] px-6 text-white">
        <section className="max-w-lg rounded-[32px] border border-amber-400/15 bg-[#081423] p-10 text-center shadow-2xl shadow-black/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl">📜</div>
          <h1 className="mt-6 text-3xl font-black">المشروع غير موجود</h1>
          <p className="mt-3 leading-7 text-slate-400">ربما تم حذف المشروع أو أن الرابط غير صحيح.</p>
          <Link href="/projects" className="mt-7 inline-flex rounded-xl bg-amber-500 px-6 py-3 font-black text-slate-950">
            العودة إلى مشاريعي
          </Link>
        </section>
      </main>
    );
  }

  const documents = project.documents ?? [];
  const projectEntities = project.projectEntities ?? [];
  const people = projectEntities.filter((item: any) => item.entity?.type === "person");
  const places = projectEntities.filter((item: any) => item.entity?.type === "place");
  const events = projectEntities.filter((item: any) => item.entity?.type === "event");
  const processingCount = documents.filter((doc: any) => doc.processingStatus === "PROCESSING").length;
  const completedCount = documents.filter((doc: any) => !doc.processingStatus || doc.processingStatus === "COMPLETED").length;
  const projectState = processingCount > 0 ? "جاري تحليل المستندات" : documents.length > 0 ? "التحليل مكتمل" : "جاهز لرفع المستندات";

  return (
    <main dir="rtl" className="min-h-screen overflow-x-hidden bg-[#030914] text-white selection:bg-amber-400/30">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -right-32 -top-44 h-[440px] w-[440px] rounded-full bg-amber-500/[0.07] blur-3xl" />
        <div className="absolute -bottom-52 left-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#030914]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-300 to-amber-600 text-2xl font-black text-[#07101c] shadow-lg shadow-amber-950/30">
              أ
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">أثر</div>
              <div className="text-[10px] font-bold tracking-[0.3em] text-slate-500">ATHAR AI</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link href="/" className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">الرئيسية</Link>
            <Link href="/projects" className="rounded-xl bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">المشاريع</Link>
            <a href="#documents" className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">المستندات</a>
            <a href="#analysis" className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">التحليل</a>
            <a href="#report" className="rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">التقرير</a>
          </nav>

          <Link href="/projects" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-amber-400/30 hover:text-amber-300">
            ← مشاريعي
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#081525] shadow-2xl shadow-black/40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(245,158,11,0.18),transparent_34%),linear-gradient(90deg,rgba(3,9,20,0.1),rgba(3,9,20,0.88))]" />
          <div className="absolute inset-y-0 left-0 hidden w-[46%] opacity-30 lg:block">
            <div className="h-full w-full bg-[linear-gradient(135deg,rgba(245,158,11,0.22),transparent_55%)]" />
          </div>

          <div className="relative grid min-h-[390px] items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-bold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {projectState}
                </span>
                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-sm font-bold text-amber-300">مشروع تاريخي</span>
              </div>

              <h1 className="mt-6 max-w-5xl text-4xl font-black leading-[1.2] sm:text-5xl lg:text-7xl">{project.title}</h1>
              <p className="mt-5 max-w-4xl text-base leading-8 text-slate-300 sm:text-lg">{project.description || "لا يوجد وصف مضاف لهذا المشروع حتى الآن."}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                  <span className="text-slate-500">الفترة التاريخية </span>
                  <span className="mr-2 font-black text-white">{project.period || "غير محددة"}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                  <span className="text-slate-500">تاريخ الإنشاء </span>
                  <span className="mr-2 font-black text-white">{formatDate(project.createdAt)}</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#upload" className="rounded-2xl bg-gradient-to-l from-amber-400 to-amber-600 px-6 py-3.5 font-black text-[#08111d] shadow-lg shadow-amber-950/30 transition hover:brightness-110">رفع مستند جديد</a>
                <a href="#documents" className="rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 font-bold text-white transition hover:border-amber-400/30 hover:bg-amber-400/[0.06]">استعراض المستندات</a>
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/[0.035] shadow-2xl shadow-amber-950/20">
                <div className="absolute inset-6 rounded-full border border-dashed border-amber-400/25" />
                <div className="absolute inset-12 rounded-full border border-white/[0.06]" />
                <div className="relative text-center">
                  <div className="text-7xl">𓂀</div>
                  <div className="mt-3 text-3xl font-black text-amber-400">أثر</div>
                  <div className="mt-1 text-xs font-bold tracking-[0.32em] text-slate-500">ATHAR AI</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-5 grid gap-4 px-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "المستندات", value: documents.length, note: `${completedCount} تمت معالجته`, icon: "📄", tone: "amber" },
            { label: "الكيانات", value: projectEntities.length, note: "أشخاص وأماكن وأحداث", icon: "◉", tone: "cyan" },
            { label: "الأحداث", value: events.length, note: "حدث تاريخي مستخرج", icon: "⌛", tone: "violet" },
            { label: "حالة التحليل", value: processingCount > 0 ? processingCount : "✓", note: projectState, icon: "✦", tone: "emerald" },
          ].map((stat) => (
            <article key={stat.label} className="rounded-[26px] border border-white/10 bg-[#0a1727]/95 p-5 shadow-xl shadow-black/30 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-4xl font-black">{stat.value}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">{stat.icon}</div>
              </div>
              <p className="mt-4 text-sm text-slate-500">{stat.note}</p>
            </article>
          ))}
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="min-w-0 space-y-8">
            <section id="documents" className="scroll-mt-28 overflow-hidden rounded-[30px] border border-white/10 bg-[#081525] shadow-xl shadow-black/25">
              <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-400">مكتبة المشروع</p>
                  <h2 className="mt-1 text-3xl font-black">المستندات</h2>
                  <p className="mt-2 text-sm text-slate-400">إدارة الملفات وفتحها وتحليل محتواها.</p>
                </div>
                <a href="#upload" className="w-fit rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-300 transition hover:bg-amber-400/15">+ رفع مستند</a>
              </div>

              {documents.length > 0 ? (
                <div className="divide-y divide-white/[0.07]">
                  {documents.map((doc: any) => {
                    const name = doc.name || doc.fileName || `مستند رقم ${doc.id}`;
                    const type = doc.type?.toUpperCase() || name.split(".").pop()?.toUpperCase() || "FILE";
                    const pages = doc.processedPages ?? doc.totalPages ?? "غير متوفر";
                    const status = getStatus(doc.processingStatus);

                    return (
                      <article key={doc.id} className="p-5 transition hover:bg-white/[0.018] sm:p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.07] text-2xl">📄</div>
                            <div className="min-w-0">
                              <h3 className="break-words text-lg font-black text-white">{name}</h3>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                                <span className="rounded-full bg-white/5 px-3 py-1.5">{type}</span>
                                <span className="rounded-full bg-white/5 px-3 py-1.5">{pages} صفحة</span>
                                <span className="rounded-full bg-white/5 px-3 py-1.5">{formatDate(doc.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${status.badge}`}>
                            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
                          {doc.url && (
                            <>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-500/15">فتح الملف</a>
                              <a href={doc.url} download={name} className="rounded-xl bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08]">تنزيل</a>
                            </>
                          )}
                          <DeleteDocumentButton documentId={doc.id} documentName={name} />
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#050e1a] p-4">
                          <DocumentQuestion documentId={doc.id} />
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="text-5xl">📂</div>
                  <h3 className="mt-4 text-xl font-black">لا توجد مستندات حتى الآن</h3>
                  <p className="mt-2 text-slate-400">ارفع أول مستند تاريخي لبدء التحليل.</p>
                </div>
              )}
            </section>

            <section id="upload" className="scroll-mt-28 rounded-[30px] border border-amber-400/15 bg-gradient-to-l from-amber-400/[0.07] to-[#081525] p-2 shadow-xl shadow-black/20">
              <ProjectDocuments projectId={project.id} />
            </section>

            <section id="analysis" className="scroll-mt-28 space-y-6">
              <div className="grid gap-5 lg:grid-cols-3">
                <EntityGroup title="الأشخاص" icon="👤" type="person" items={people} />
                <EntityGroup title="الأماكن" icon="📍" type="place" items={places} />
                <EntityGroup title="الأحداث" icon="⌛" type="event" items={events} />
              </div>

              {project.summary && (
                <section className="rounded-[30px] border border-cyan-400/15 bg-cyan-400/[0.035] p-6 shadow-xl shadow-black/20 sm:p-8">
                  <p className="text-sm font-bold text-cyan-300">ملخص المشروع</p>
                  <h2 className="mt-2 text-3xl font-black">قراءة أولية للمحتوى</h2>
                  <p className="mt-5 whitespace-pre-line leading-9 text-slate-300">{project.summary}</p>
                </section>
              )}

              <ProjectAIAnalysis project={project} />
            </section>

            <section id="report" className="scroll-mt-28 space-y-8">
              <HistoricalReport project={project} />
              <HistoricalTimeline project={project} />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-28 xl:self-start">
            <section className="rounded-[30px] border border-amber-400/15 bg-gradient-to-b from-amber-400/[0.08] to-[#081525] p-6 shadow-xl shadow-black/25">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-xl text-[#08111d]">✦</div>
                <div>
                  <h2 className="text-xl font-black">مركز المشروع</h2>
                  <p className="text-xs text-slate-500">تنقل سريع داخل البحث</p>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                {[
                  ["المستندات", "#documents", documents.length],
                  ["رفع مستند", "#upload", "+"],
                  ["التحليل", "#analysis", projectEntities.length],
                  ["التقرير", "#report", "←"],
                ].map(([label, href, value]) => (
                  <a key={String(label)} href={String(href)} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3.5 text-sm font-bold text-slate-200 transition hover:border-amber-400/25 hover:bg-amber-400/[0.06] hover:text-amber-300">
                    <span>{label}</span>
                    <span className="text-slate-500">{value}</span>
                  </a>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-[#081525] p-6 shadow-xl shadow-black/20">
              <p className="text-sm font-bold text-amber-400">نظرة سريعة</p>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4"><span className="text-sm text-slate-400">الأشخاص</span><strong>{people.length}</strong></div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4"><span className="text-sm text-slate-400">الأماكن</span><strong>{places.length}</strong></div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4"><span className="text-sm text-slate-400">الأحداث</span><strong>{events.length}</strong></div>
                <div className="flex items-center justify-between"><span className="text-sm text-slate-400">المستندات المكتملة</span><strong className="text-emerald-300">{completedCount}</strong></div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#081525] p-6 text-center shadow-xl shadow-black/20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-amber-400/30 bg-amber-400/[0.05] text-4xl">📜</div>
              <h3 className="mt-4 text-2xl font-black text-amber-400">أثر</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">منصة الذكاء الاصطناعي للبحث التاريخي.</p>
            </section>
          </aside>
        </div>

        <footer className="mt-10 flex flex-col gap-3 border-t border-white/10 py-7 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 أثر للذكاء الاصطناعي — جميع الحقوق محفوظة.</p>
          <p>منصة بحثية عربية موثوقة</p>
        </footer>
      </div>
    </main>
  );
}