"use client";

type EntityData = {
  people?: string[];
  places?: string[];
  events?: string[];
};

type Props = {
  document: {
    id: number;
    name: string;
    url: string;
    type: string;
    summary?: string | null;
    entities?: EntityData | null;
    createdAt?: string;
  };
  onDelete: (id: number) => void;
  onPreview: (url: string) => void;
};

export default function DocumentCard({
  document,
  onDelete,
  onPreview,
}: Props) {
  const people = document.entities?.people ?? [];
  const places = document.entities?.places ?? [];
  const events = document.entities?.events ?? [];

  function fileIcon() {
    if (document.type.includes("pdf")) return "📕";
    if (document.type.includes("word")) return "📘";
    return "📄";
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="text-lg font-semibold">
            {fileIcon()} {document.name}
          </h3>

          {document.createdAt && (
            <p className="text-sm text-gray-500">
              {new Date(document.createdAt).toLocaleString()}
            </p>
          )}

        </div>

        <div className="flex gap-2">

          <button
            onClick={() => onPreview(document.url)}
            className="rounded bg-gray-200 px-3 py-2 hover:bg-gray-300"
          >
            👁 Preview
          </button>

          <a
            href={document.url}
            download
            className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
          >
            ⬇ Download
          </a>

          <button
            onClick={() => onDelete(document.id)}
            className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700"
          >
            🗑 Delete
          </button>

        </div>

      </div>

      <div>

        <h4 className="font-semibold mb-1">
          📝 Summary
        </h4>

        <p className="text-gray-700">
          {document.summary || "No AI summary available."}
        </p>

      </div>

      <div className="grid md:grid-cols-3 gap-4">

        <div className="rounded-lg bg-blue-50 p-3">

          <h4 className="font-semibold mb-2">
            👤 People
          </h4>

          {people.length === 0 ? (
            <p className="text-sm text-gray-500">
              None
            </p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {people.map((person) => (
                <li key={person}>{person}</li>
              ))}
            </ul>
          )}

        </div>

        <div className="rounded-lg bg-green-50 p-3">

          <h4 className="font-semibold mb-2">
            📍 Places
          </h4>

          {places.length === 0 ? (
            <p className="text-sm text-gray-500">
              None
            </p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {places.map((place) => (
                <li key={place}>{place}</li>
              ))}
            </ul>
          )}

        </div>

        <div className="rounded-lg bg-yellow-50 p-3">

          <h4 className="font-semibold mb-2">
            📅 Events
          </h4>

          {events.length === 0 ? (
            <p className="text-sm text-gray-500">
              None
            </p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {events.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          )}

        </div>

      </div>

    </div>
  );
}