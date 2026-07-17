"use client";

import Link from "next/link";

type EntityItem = {
  entity: {
    id: number;
    name: string;
    slug: string;
    type: "person" | "place" | "event";
  };
};

type ProjectAIAnalysisProps = {
  project: any;
};

export default function ProjectAIAnalysis({
  project,
}: ProjectAIAnalysisProps) {
  console.log("Summary:", project.summary);
console.log("Documents:", project.documents);
console.log("ProjectEntities:", project.projectEntities);
  
  const entities: EntityItem[] = project.projectEntities || [];

  const people = entities.filter(
    (item) => item.entity.type === "person"
  );

  const places = entities.filter(
    (item) => item.entity.type === "place"
  );

  const events = entities.filter(
    (item) => item.entity.type === "event"
  );

  const documents = project.documents || [];

  return (
    <section className="space-y-8">

      {/* ============================= */}
      {/* AI HISTORICAL REPORT */}
      {/* ============================= */}

      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-6">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-black text-cyan-300">
              🤖 AI Historical Analysis
            </h2>

            <p className="mt-2 text-slate-400">
              تحليل تاريخي للمشروع اعتمادًا على البيانات
              المستخرجة من المستندات.
            </p>
          </div>

          <div className="rounded-xl bg-cyan-500/10 px-4 py-2 text-cyan-300">
            Ready
          </div>

        </div>

      </div>

      {/* ============================= */}
      {/* STATISTICS */}
      {/* ============================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          icon="📄"
          title="Documents"
          value={documents.length}
        />

        <StatCard
          icon="👤"
          title="People"
          value={people.length}
        />

        <StatCard
          icon="📍"
          title="Places"
          value={places.length}
        />

        <StatCard
          icon="⚔️"
          title="Events"
          value={events.length}
        />

      </div>

      {/* ============================= */}
      {/* SUMMARY */}
      {/* ============================= */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

        <h3 className="mb-4 text-xl font-bold text-cyan-300">
          📄 Historical Summary
        </h3>

        {project.summary ? (
          <p className="leading-8 text-slate-300">
            {project.summary}
          </p>
        ) : (
          <p className="text-slate-500">
            لا يوجد ملخص تاريخي حتى الآن.
          </p>
        )}

      </div>

      {/* ============================= */}
      {/* ENTITIES */}
      {/* ============================= */}

      <div className="grid gap-6 lg:grid-cols-3">

        <EntityCard
          title="👤 الشخصيات"
          type="person"
          items={people}
        />

        <EntityCard
          title="📍 الأماكن"
          type="place"
          items={places}
        />

        <EntityCard
          title="⚔️ الأحداث"
          type="event"
          items={events}
        />

      </div>
            {/* ============================= */}
      {/* TIMELINE */}
      {/* ============================= */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

        <h3 className="mb-5 text-xl font-bold text-cyan-300">
          ⏳ Timeline
        </h3>

        {events.length === 0 ? (
          <p className="text-slate-500">
            لا توجد أحداث تاريخية.
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((item, index) => (
              <div
                key={item.entity.id}
                className="flex items-start gap-4"
              >
                <div className="mt-2 h-3 w-3 rounded-full bg-cyan-400" />

                <div>
                  <Link
                    href={`/entities/event/${item.entity.slug}`}
                    className="font-semibold text-white hover:text-cyan-300"
                  >
                    {item.entity.name}
                  </Link>

                  <p className="text-sm text-slate-400">
                    Event #{index + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ============================= */}
      {/* DOCUMENTS */}
      {/* ============================= */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

        <h3 className="mb-5 text-xl font-bold text-cyan-300">
          📄 Source Documents
        </h3>

        {documents.length === 0 ? (
          <p className="text-slate-500">
            لا توجد مستندات.
          </p>
        ) : (
          <div className="grid gap-3">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="rounded-xl border border-white/10 bg-slate-800 p-4"
              >
                <div className="font-semibold text-white">
  {doc.name || doc.fileName || `مستند رقم ${doc.id}`}
</div>

                {doc.type && (
                  <div className="mt-1 text-sm text-slate-400">
                    {doc.type}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

    </section>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

      <div className="text-3xl">
        {icon}
      </div>

      <div className="mt-3 text-sm text-slate-400">
        {title}
      </div>

      <div className="mt-2 text-3xl font-black text-cyan-300">
        {value}
      </div>

    </div>
  );
}

function EntityCard({
  title,
  type,
  items,
}: {
  title: string;
  type: "person" | "place" | "event";
  items: EntityItem[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

      <h3 className="mb-5 text-lg font-bold">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-slate-500">
          لا يوجد
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.entity.id}
              href={`/entities/${type}/${item.entity.slug}`}
              className="block rounded-xl bg-slate-800 p-3 transition hover:bg-slate-700"
            >
              {item.entity.name}
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}