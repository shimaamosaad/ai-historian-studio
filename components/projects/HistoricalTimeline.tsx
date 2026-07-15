"use client";

type ProjectEntity = {
  entity: {
    id: number;
    name: string;
    slug?: string;
    type: string;
  };
};

type Props = {
  project: {
    projectEntities?: ProjectEntity[];
  };
};

type TimelineItem = {
  id: number;
  title: string;
  type: string;
  slug?: string;
  station: number;
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

export default function HistoricalTimeline({
  project,
}: Props) {
  const timeline: TimelineItem[] =
    project.projectEntities?.map((item, index) => ({
      id: item.entity.id,
      title: item.entity.name,
      slug: item.entity.slug,
      type: item.entity.type,
      station: index + 1,
    })) ?? [];

  if (timeline.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-8">

        <h2 className="mb-6 text-3xl font-black text-white">
          📜 التسلسل الزمني
        </h2>

        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
          لا توجد أحداث تاريخية داخل المشروع.
        </div>

      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-8">

      <div className="mb-10 flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-black text-white">
            📜 التسلسل الزمني
          </h2>

          <p className="mt-2 text-slate-400">
            عرض زمني للكيانات التاريخية المستخرجة من الوثائق.
          </p>

        </div>

        <div className="rounded-full bg-cyan-900/30 px-4 py-2 text-sm font-semibold text-cyan-300">
          {timeline.length} عناصر
        </div>

      </div>

      <div className="relative">

        <div className="absolute right-7 top-0 bottom-0 w-[3px] rounded-full bg-slate-700" />

        <div className="space-y-8">

{timeline.map((item) => (
  <div
    key={item.id}
    className="relative flex justify-end pr-20"
  >
    {/* النقطة */}
    <div
      className={`absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-slate-900 text-lg shadow-lg ${getDotColor(
        item.type
      )}`}
    >
      {getIcon(item.type)}
    </div>

    {/* البطاقة */}
    <div className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-900/30">

      <div className="mb-3 flex items-center justify-between">

        <span className="rounded-full bg-cyan-900/30 px-3 py-1 text-xs font-semibold text-cyan-300">
          المحطة {item.station}
        </span>

        <span className="text-xs text-slate-400">
          {getTitle(item.type)}
        </span>

      </div>

      <h3 className="text-2xl font-bold text-white">
        {item.title}
      </h3>

      <div className="mt-6 flex flex-wrap gap-2">

        <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
          {getIcon(item.type)} {getTitle(item.type)}
        </span>

        <span className="rounded-full bg-cyan-900/20 px-3 py-1 text-sm text-cyan-300">
          مستخرج بواسطة الذكاء الاصطناعي
        </span>

      </div>

    </div>
  </div>
))}
        </div>
      </div>
    </section>
  );
}