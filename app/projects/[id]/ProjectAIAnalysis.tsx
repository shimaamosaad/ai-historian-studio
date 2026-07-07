"use client";

export default function ProjectAIAnalysis({ project }: any) {
  const analysis = project?.summary
    ? {
        summary: project.summary,
        entities: project.entities || {
          people: [],
          places: [],
          events: [],
        },
      }
    : null;

  if (!analysis) {
    return (
      <div className="p-4 border rounded-xl bg-gray-50">
        🤖 No AI analysis available yet
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* 🧠 SUMMARY */}
      <div className="p-5 rounded-2xl border bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-3">🧠 AI Summary</h2>
        <p className="text-gray-700 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* 🧩 ENTITIES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <EntityBox title="👤 People" items={analysis.entities.people} />
        <EntityBox title="📍 Places" items={analysis.entities.places} />
        <EntityBox title="📅 Events" items={analysis.entities.events} />

      </div>

      {/* ⏳ TIMELINE */}
      <div className="p-5 rounded-2xl border bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-4">⏳ Timeline</h2>

        {analysis.entities.events.length === 0 ? (
          <p className="text-gray-400">No events detected</p>
        ) : (
          <div className="space-y-3">
            {analysis.entities.events.map((event: string, i: number) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-2 h-2 mt-2 rounded-full bg-black" />
                <span className="text-gray-700">{event}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

/* ⭐ ENTITY BOX (CLICKABLE) */
function EntityBox({ title, items }: any) {
  const handleClick = (item: string) => {
    alert(`Entity clicked: ${item}`);
  };

  return (
    <div className="p-4 rounded-2xl border bg-gray-50">
      <h3 className="font-semibold mb-3">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No data</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item: string, i: number) => (
            <button
              key={i}
              onClick={() => handleClick(item)}
              className="px-2 py-1 text-sm bg-white border rounded-full hover:bg-black hover:text-white transition"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}