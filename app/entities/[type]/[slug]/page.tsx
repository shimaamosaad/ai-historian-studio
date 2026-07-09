import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import KnowledgeGraph from "@/components/graph/KnowledgeGraph";

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

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-green-500/30 bg-green-950/20 p-6">
            <h2 className="mb-5 text-xl font-bold text-green-300">
              ➜ العلاقات الصادرة
            </h2>

            {entity.outgoingRelations.length === 0 ? (
              <p className="text-slate-500">
                لا توجد علاقات.
              </p>
            ) : (
              <div className="space-y-4">
                {entity.outgoingRelations.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-900 p-4"
                  >
                    <div className="font-bold text-green-400">
                      {item.relation}
                    </div>

                    <Link
                      href={`/entities/${item.target.type}/${item.target.slug}`}
                      className="mt-2 block text-lg hover:text-cyan-400"
                    >
                      {item.target.name}
                    </Link>

                    {item.target.summary && (
                      <p className="mt-2 text-sm text-slate-400">
                        {item.target.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6">
            <h2 className="mb-5 text-xl font-bold text-purple-300">
              ◀ العلاقات الواردة
            </h2>

            {entity.incomingRelations.length === 0 ? (
              <p className="text-slate-500">
                لا توجد علاقات.
              </p>
            ) : (
              <div className="space-y-4">
                {entity.incomingRelations.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-900 p-4"
                  >
                    <div className="font-bold text-purple-400">
                      {item.relation}
                    </div>

                    <Link
                      href={`/entities/${item.source.type}/${item.source.slug}`}
                      className="mt-2 block text-lg hover:text-cyan-400"
                    >
                      {item.source.name}
                    </Link>

                    {item.source.summary && (
                      <p className="mt-2 text-sm text-slate-400">
                        {item.source.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-bold text-cyan-300">
            🌐 الشبكة المعرفية
          </h2>

          <KnowledgeGraph slug={entity.slug} />
        </div>

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