import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

async function getEntity(type: string, slug: string) {
  const headersList = await headers();

  const host = headersList.get("host");
  const protocol =
    process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(
    `${protocol}://${host}/api/entities/${slug}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return null;
  }

  const entity = await res.json();

  if (entity.type !== type) {
    return null;
  }

  return entity;
}

export default async function EntityPage({
  params,
}: {
  params: Promise<{
    type: string;
    slug: string;
  }>;
}) {
  const { type, slug } = await params;

  const entity = await getEntity(type, slug);

  if (!entity) {
    notFound();
  }

  const titles: Record<string, string> = {
    person: "👤 شخص",
    place: "📍 مكان",
    event: "⚔️ حدث",
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 text-sm text-cyan-400">
              {titles[type] ?? "🏛️ كيان تاريخي"}
            </div>

            <h1 className="text-4xl font-black">
              {entity.name}
            </h1>
          </div>

          <Link
            href="/projects"
            className="rounded-xl bg-slate-800 px-4 py-2 hover:bg-slate-700"
          >
            رجوع
          </Link>
        </div>

        {entity.description && (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-bold">
              الوصف
            </h2>

            <p className="leading-8 text-slate-300">
              {entity.description}
            </p>
          </div>
        )}

        {entity.summary && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6">
            <h2 className="mb-4 text-xl font-bold text-cyan-300">
              ملخص الذكاء الاصطناعي
            </h2>

            <p className="leading-8 text-slate-300">
              {entity.summary}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-bold">
            📚 المشاريع المرتبطة
          </h2>

          {entity.projects.length === 0 ? (
            <p className="text-slate-500">
              لا توجد مشاريع مرتبطة.
            </p>
          ) : (
            <div className="space-y-4">
              {entity.projects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-xl bg-slate-800 p-4 transition hover:bg-slate-700"
                >
                  <h3 className="text-lg font-bold">
                    {project.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {project.period}
                  </p>

                  {project.summary && (
                    <p className="mt-3 line-clamp-3 text-slate-300">
                      {project.summary}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}