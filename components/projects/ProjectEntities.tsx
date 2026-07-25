import Link from "next/link";

type ProjectEntityItem = {
  entity: {
    id: number;
    name: string;
    slug: string;
    type: string;
  };
};

type Props = {
  people: ProjectEntityItem[];
  places: ProjectEntityItem[];
  events: ProjectEntityItem[];
};

type EntityCardProps = {
  title: string;
  icon: string;
  items: ProjectEntityItem[];
  emptyMessage: string;
  entityType: "person" | "place" | "event";
};

function EntityCard({
  title,
  icon,
  items,
  emptyMessage,
  entityType,
}: EntityCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1727] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {icon} {title}
        </h2>

        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((item) => (
            <Link
              key={item.entity.id}
              href={`/entities/${entityType}/${item.entity.slug}`}
              className="block rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3 text-sm font-semibold transition hover:border-amber-400/20 hover:bg-amber-400/5 hover:text-amber-300"
            >
              {item.entity.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectEntities({
  people,
  places,
  events,
}: Props) {
  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      <EntityCard
        title="الأشخاص"
        icon="👤"
        items={people}
        emptyMessage="لا توجد شخصيات بعد"
        entityType="person"
      />

      <EntityCard
        title="الأماكن"
        icon="📍"
        items={places}
        emptyMessage="لا توجد أماكن بعد"
        entityType="place"
      />

      <EntityCard
        title="الأحداث"
        icon="⚔️"
        items={events}
        emptyMessage="لا توجد أحداث بعد"
        entityType="event"
      />
    </section>
  );
}