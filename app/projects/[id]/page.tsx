import Link from "next/link";
import ProjectAIAnalysis from "./ProjectAIAnalysis";
import ProjectDocuments from "@/components/documents/ProjectDocuments";
import HistoricalReport from "@/components/projects/HistoricalReport";
import HistoricalTimeline from "@/components/projects/HistoricalTimeline";

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

        {project.documents?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

            <h2 className="mb-5 text-xl font-bold">
              📄 المستندات
            </h2>

            <div className="space-y-2">
              {project.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="rounded-lg bg-slate-800 p-3"
                >
                  {doc.fileName}
                </div>
              ))}
            </div>

          </div>
        )}

        <ProjectDocuments projectId={project.id} />
        <ProjectAIAnalysis project={project} />
<HistoricalReport project={project} />
<HistoricalTimeline project={project} />

      </div>
    </main>
  );
}