import DeleteDocumentButton from "@/components/documents/DeleteDocumentButton";
import Link from "next/link";
import ProjectAIAnalysis from "./ProjectAIAnalysis";
import ProjectDocuments from "@/components/documents/ProjectDocuments";
import HistoricalReport from "@/components/projects/HistoricalReport";
import HistoricalTimeline from "@/components/projects/HistoricalTimeline";
import DocumentQuestion from "@/components/documents/DocumentQuestion";

async function getProject(id: string) {
  const res = await fetch(`http://localhost:3000/api/projects/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
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
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-2xl font-bold">
          المشروع غير موجود
        </h1>
      </main>
    );
  }

  const people =
    project.projectEntities?.filter(
      (item: any) => item.entity.type === "person"
    ) || [];

  const places =
    project.projectEntities?.filter(
      (item: any) => item.entity.type === "place"
    ) || [];

  const events =
    project.projectEntities?.filter(
      (item: any) => item.entity.type === "event"
    ) || [];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">

        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black">
            {project.title}
          </h1>

          <Link
            href="/projects"
            className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700"
          >
            رجوع
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <h2 className="text-xl font-bold mb-4">
            وصف المشروع
          </h2>

          <p className="leading-8 text-slate-300">
            {project.description}
          </p>

          <div className="mt-6 text-sm text-slate-400">
            📜 {project.period}
          </div>

        </div>

        {project.summary && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6">

            <h2 className="mb-4 text-xl font-bold text-cyan-300">
              ملخص الذكاء الاصطناعي
            </h2>

            <p className="leading-8 text-slate-300">
              {project.summary}
            </p>

          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

            <h2 className="mb-5 text-xl font-bold">
              👤 الأشخاص
            </h2>

            {people.length === 0 ? (
              <p className="text-slate-500">
                لا يوجد
              </p>
            ) : (
              <div className="space-y-3">
                {people.map((item: any) => (
                  <Link
                    key={item.entity.id}
                    href={`/entities/person/${item.entity.slug}`}
                    className="block rounded-lg bg-slate-800 p-3 hover:bg-slate-700"
                  >
                    {item.entity.name}
                  </Link>
                ))}
              </div>
            )}

          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

            <h2 className="mb-5 text-xl font-bold">
              📍 الأماكن
            </h2>

            {places.length === 0 ? (
              <p className="text-slate-500">
                لا يوجد
              </p>
            ) : (
              <div className="space-y-3">
                {places.map((item: any) => (
                  <Link
                    key={item.entity.id}
                    href={`/entities/place/${item.entity.slug}`}
                    className="block rounded-lg bg-slate-800 p-3 hover:bg-slate-700"
                  >
                    {item.entity.name}
                  </Link>
                ))}
              </div>
            )}

          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

            <h2 className="mb-5 text-xl font-bold">
              ⚔️ الأحداث
            </h2>

            {events.length === 0 ? (
              <p className="text-slate-500">
                لا يوجد
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((item: any) => (
                  <Link
                    key={item.entity.id}
                    href={`/entities/event/${item.entity.slug}`}
                    className="block rounded-lg bg-slate-800 p-3 hover:bg-slate-700"
                  >
                    {item.entity.name}
                  </Link>
                ))}
              </div>
            )}

          </div>

        </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-bold">
            📄 المستندات
          </h2>

          {project.documents?.length > 0 ? (
            <div className="space-y-6">
              {project.documents.map((doc: any) => {
                const documentName =
                  doc.name ||
                  doc.fileName ||
                  `مستند رقم ${doc.id}`;

                const documentType =
                  doc.type?.toUpperCase() ||
                  documentName.split(".").pop()?.toUpperCase() ||
                  "FILE";

                const uploadDate = doc.createdAt
                  ? new Intl.DateTimeFormat("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(doc.createdAt))
                  : "غير متوفر";

                const processedPages =
                  doc.processedPages ?? doc.totalPages ?? null;

                const processingStatus =
                  doc.processingStatus || "COMPLETED";

                return (
                  <article
                    key={doc.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/80 shadow-lg"
                  >
                    {/* رأس البطاقة */}
                    <div className="border-b border-white/10 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-2xl">
                            📄
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words text-lg font-bold text-white">
                              {documentName}
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                              مستند رقم {doc.id}
                            </p>
                          </div>
                        </div>

                        {processingStatus === "COMPLETED" ? (
                          <span className="w-fit rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
                            ✓ تمت المعالجة
                          </span>
                        ) : processingStatus === "PROCESSING" ? (
                          <span className="w-fit rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-300">
                            ⏳ جاري التحليل
                          </span>
                        ) : (
                          <span className="w-fit rounded-full bg-red-500/15 px-3 py-1 text-sm font-medium text-red-300">
                            ⚠ فشل التحليل
                          </span>
                        )}
                      </div>
                    </div>

                    {/* معلومات المستند */}
                    <div className="grid gap-3 border-b border-white/10 p-5 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-900/60 p-4">
                        <p className="text-xs text-slate-400">
                          تاريخ الرفع
                        </p>

                        <p className="mt-2 font-semibold text-slate-100">
                          {uploadDate}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900/60 p-4">
                        <p className="text-xs text-slate-400">
                          نوع الملف
                        </p>

                        <p className="mt-2 font-semibold text-slate-100">
                          {documentType}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900/60 p-4">
                        <p className="text-xs text-slate-400">
                          عدد الصفحات
                        </p>

                        <p className="mt-2 font-semibold text-slate-100">
                          {processedPages !== null
                            ? processedPages
                            : "غير متوفر"}
                        </p>
                      </div>
                    </div>

                    {/* أدوات الملف */}
                    <div className="flex flex-wrap gap-3 border-b border-white/10 p-5">
                      {doc.url && (
                        <>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            👁 فتح الملف
                          </a>

                          <a
                            href={doc.url}
                            download={documentName}
                            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                          >
                            ⬇ تنزيل الملف
                          </a>
                        </>
                      )}

                      <DeleteDocumentButton
                        documentId={doc.id}
                        documentName={documentName}
                      />
                    </div>

                    {/* سؤال المستند */}
                    <div className="p-5">
                      <DocumentQuestion documentId={doc.id} />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-800/50 p-8 text-center">
              <div className="text-4xl">
                📂
              </div>

              <h3 className="mt-3 font-semibold text-white">
                لا توجد مستندات حتى الآن
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                ارفعي أول مستند تاريخي لبدء التحليل.
              </p>
            </div>
          )}
        </div>

        <ProjectDocuments projectId={project.id} />

        <ProjectAIAnalysis project={project} />

        <HistoricalReport project={project} />

        <HistoricalTimeline project={project} />
      </div>
    </main>
  );
}