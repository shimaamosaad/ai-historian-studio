"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type ExtractedEntities = {
  people?: string[];
  places?: string[];
  events?: string[];
};

type ProjectDocument = {
  id: number;
  name: string;
  entities?: string | null;
};

type ProjectEntity = {
  entity: {
    id: number;
    name: string;
    slug?: string;
    type: string;
    summary?: string | null;
    description?: string | null;
  };
};

type Props = {
  project: {
    projectEntities?: ProjectEntity[];
    documents?: ProjectDocument[];
  };
};

type TimelineItem = {
  id: number;
  title: string;
  type: string;
  slug?: string;
  description?: string | null;
  station: number;
  sources: string[];
};

function getIcon(type: string) {
  switch (type.toLowerCase()) {
    case "person":
      return "👤";
    case "place":
      return "📍";
    case "event":
      return "⚔️";
    default:
      return "📄";
  }
}

function getTitle(type: string) {
  switch (type.toLowerCase()) {
    case "person":
      return "شخصية تاريخية";
    case "place":
      return "مكان تاريخي";
    case "event":
      return "حدث تاريخي";
    default:
      return "كيان تاريخي";
  }
}

function getDotColor(type: string) {
  switch (type.toLowerCase()) {
    case "person":
      return "bg-blue-500";
    case "place":
      return "bg-green-500";
    case "event":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
}

function getEntitySources(
  entity: ProjectEntity["entity"],
  documents: ProjectDocument[]
) {
  const collectionByType: Record<string, keyof ExtractedEntities> = {
    person: "people",
    place: "places",
    event: "events",
  };
  const collection = collectionByType[entity.type];

  if (!collection) return [];

  return documents.flatMap((document) => {
    if (!document.entities) return [];

    try {
      const entities = JSON.parse(document.entities) as ExtractedEntities;
      return entities[collection]?.includes(entity.name) ? [document.name] : [];
    } catch {
      return [];
    }
  });
}

export default function HistoricalTimeline({ project }: Props) {
  const documents = project.documents ?? [];
  const timeline: TimelineItem[] =
    project.projectEntities?.map((item, index) => ({
      id: item.entity.id,
      title: item.entity.name,
      slug: item.entity.slug,
      type: item.entity.type,
      description: item.entity.description ?? item.entity.summary,
      station: index + 1,
      sources: getEntitySources(item.entity, documents),
    })) ?? [];

  if (timeline.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-8" dir="rtl">
        <h2 className="mb-6 text-3xl font-black text-white">📜 التسلسل الزمني</h2>
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          لا توجد كيانات تاريخية داخل المشروع.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-8" dir="rtl">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">📜 التسلسل الزمني</h2>
          <p className="mt-2 text-slate-400">
            استكشف الكيانات التاريخية المستخرجة من وثائق المشروع.
          </p>
        </div>
        <div className="shrink-0 rounded-full bg-cyan-900/30 px-4 py-2 text-sm font-semibold text-cyan-300">
          {timeline.length} عناصر
        </div>
      </div>

      <div className="relative">
        <div className="absolute bottom-0 right-7 top-0 w-[3px] rounded-full bg-slate-700" />

        <div className="space-y-8">
          {timeline.map((item) => {
            const href = item.slug ? `/entities/${item.type}/${item.slug}` : null;
            const content = (
              <div className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-900/30">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-cyan-900/30 px-3 py-1 text-xs font-semibold text-cyan-300">
                    المحطة {item.station}
                  </span>
                  <span className="text-xs text-slate-400">{getTitle(item.type)}</span>
                </div>

                <h3 className="text-2xl font-bold text-white">{item.title}</h3>

                <p className="mt-3 leading-7 text-slate-300">
                  {item.description || "لا يتوفر وصف مختصر لهذا الكيان حتى الآن."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
                    {getIcon(item.type)} {getTitle(item.type)}
                  </span>
                  {item.sources.map((source) => (
                    <span
                      key={source}
                      className="rounded-full bg-amber-900/30 px-3 py-1 text-sm text-amber-200"
                    >
                      المصدر: {source}
                    </span>
                  ))}
                </div>

                {href && (
                  <p className="mt-5 text-sm font-semibold text-cyan-300">
                    اضغط لعرض صفحة الكيان ←
                  </p>
                )}
              </div>
            );

            return (
              <motion.div
                key={item.id}
                className="relative flex justify-end pr-20"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: Math.min(item.station * 0.04, 0.24) }}
              >
                <div
                  className={`absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-slate-900 text-lg shadow-lg ${getDotColor(item.type)}`}
                >
                  {getIcon(item.type)}
                </div>

                {href ? (
                  <Link href={href} className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
