import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DeleteProjectButton from "@/components/projects/DeleteProjectButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailsPage({ params }: Props) {
  const { id } = await params;

  const projectId = Number(id);

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400 text-lg">المشروع غير موجود</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-black">
            {project.title}
          </h1>

          <div className="flex gap-3">
            <Link
              href={`/projects/${project.id}/edit`}
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2 font-medium text-black transition hover:bg-slate-200"
            >
              ✏️ تعديل المشروع
            </Link>

            <DeleteProjectButton projectId={project.id} />
          </div>
        </div>

        {/* Description */}
        <p className="mb-8 leading-relaxed text-slate-300">
          {project.description}
        </p>

        {/* Details */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="space-y-3 text-slate-300">
            <p>
              <span className="font-semibold">📜 الفترة:</span>{" "}
              {project.period}
            </p>

            <p>
              <span className="font-semibold">🌍 الإقليم:</span>{" "}
              {project.region}
            </p>

            <p>
              <span className="font-semibold">🗣 اللغة:</span>{" "}
              {project.language}
            </p>

            <p>
              <span className="font-semibold">📅 تاريخ الإنشاء:</span>{" "}
              {new Date(project.createdAt).toLocaleDateString("ar-EG")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}