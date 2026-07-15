import Link from "next/link";

type Props = {
  project: any;
};

export default function HistoricalReport({
  project,
}: Props) {
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

  const relations = project.entityRelations || [];
const peopleCount = people.length;

const placesCount = places.length;

const eventsCount = events.length;

const relationsCount = relations.length;

const documentsCount =
  project.documents?.length || 0;

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-6">
      <h2 className="mb-6 text-3xl font-black text-amber-300">
        📜 Historical Report
      </h2>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-xl font-bold">
            Summary
          </h3>

          <p className="leading-8 text-slate-300">
            {project.summary || "لا يوجد ملخص."}
          </p>
        </div>

        <div>

  <h3 className="mb-3 text-xl font-bold">
    Historical Context
  </h3>

  <p className="leading-8 text-slate-300">

    يعتمد هذا التقرير على تحليل الوثائق التاريخية
    الموجودة داخل المشروع.

    وقد تم التعرف على

    <span className="font-bold text-cyan-400">
      {" "}{peopleCount} شخصية
    </span>

    ، و

    <span className="font-bold text-cyan-400">
      {placesCount} مكانًا
    </span>

    ، و

    <span className="font-bold text-cyan-400">
      {eventsCount} حدثًا
    </span>

    ، بالإضافة إلى

    <span className="font-bold text-cyan-400">
      {relationsCount} علاقة
    </span>

    تربط بين الكيانات التاريخية المستخرجة من

    <span className="font-bold text-cyan-400">
      {" "}{documentsCount} وثيقة
    </span>

    داخل المشروع.

  </p>

</div>

<div>

  <h3 className="mb-4 text-xl font-bold">
    📌 أبرز النتائج
  </h3>

  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

    <div className="rounded-xl bg-slate-800 p-4 text-center">
      <div className="text-3xl font-black text-cyan-400">
        {peopleCount}
      </div>

      <div className="mt-2 text-sm text-slate-400">
    👤
الشخصيات
      </div>
    </div>

    <div className="rounded-xl bg-slate-800 p-4 text-center">
      <div className="text-3xl font-black text-cyan-400">
        {placesCount}
      </div>

      <div className="mt-2 text-sm text-slate-400">
        📍 الأماكن
      </div>
    </div>

    <div className="rounded-xl bg-slate-800 p-4 text-center">
      <div className="text-3xl font-black text-cyan-400">
        {eventsCount}
      </div>

      <div className="mt-2 text-sm text-slate-400">
        ⚔️ الأحداث
      </div>
    </div>

    <div className="rounded-xl bg-slate-800 p-4 text-center">
      <div className="text-3xl font-black text-cyan-400">
        {relationsCount}
      </div>

      <div className="mt-2 text-sm text-slate-400">
        🔗 العلاقات
      </div>
    </div>

    <div className="rounded-xl bg-slate-800 p-4 text-center">
      <div className="text-3xl font-black text-cyan-400">
        {documentsCount}
      </div>

      <div className="mt-2 text-sm text-slate-400">
        📄 الوثائق
      </div>
    </div>

  </div>

</div>
        <div className="grid gap-6 md:grid-cols-3">

          <div>
            <h3 className="mb-3 font-bold">
              👤 Key People
            </h3>

            <div className="space-y-2">
              {people.length === 0 ? (
                <p className="text-slate-500">
                  لا يوجد
                </p>
              ) : (
                people.map((item: any) => (
                  <Link
                    key={item.entity.id}
                    href={`/entities/person/${item.entity.slug}`}
                    className="block rounded-lg bg-slate-800 p-3 hover:bg-slate-700"
                  >
                    {item.entity.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-bold">
              📍 Places
            </h3>

            <div className="space-y-2">
              {places.length === 0 ? (
                <p className="text-slate-500">
                  لا يوجد
                </p>
              ) : (
                places.map((item: any) => (
                  <Link
                    key={item.entity.id}
                    href={`/entities/place/${item.entity.slug}`}
                    className="block rounded-lg bg-slate-800 p-3 hover:bg-slate-700"
                  >
                    {item.entity.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-bold">
              ⚔️ Events
            </h3>

            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-slate-500">
                  لا يوجد
                </p>
              ) : (
                events.map((item: any) => (
                  <Link
                    key={item.entity.id}
                    href={`/entities/event/${item.entity.slug}`}
                    className="block rounded-lg bg-slate-800 p-3 hover:bg-slate-700"
                  >
                    {item.entity.name}
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>

        <div>
          <h3 className="mb-3 text-xl font-bold">
            🔗 Relations
          </h3>

          {relations.length === 0 ? (
            <p className="text-slate-500">
              لا توجد علاقات.
            </p>
          ) : (
            <div className="space-y-2">
              {relations.map((relation: any) => (
                <div
                  key={relation.id}
                  className="rounded-lg bg-slate-800 p-3"
                >
                  {relation.source?.name}
                  {" — "}
                  <span className="text-cyan-400">
                    {relation.relation}
                  </span>
                  {" → "}
                  {relation.target?.name}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}