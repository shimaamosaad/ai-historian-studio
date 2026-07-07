type PageProps = {
  params: Promise<{
    name: string;
  }>;
};

export default async function EventPage({ params }: PageProps) {
  const { name } = await params;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h1 className="text-3xl font-bold">
            📅 {decodeURIComponent(name)}
          </h1>

          <p className="text-gray-500 mt-2">
            Historical Event
          </p>
        </div>

        {/* AI Summary */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-3">
            🧠 AI Summary
          </h2>

          <p className="text-gray-600">
            AI-generated summary of this historical event will appear here.
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-3">
            ⏳ Timeline
          </h2>

          <p className="text-gray-600">
            Timeline and chronological details will appear here.
          </p>
        </div>

        {/* Related People */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-3">
            👤 Related People
          </h2>

          <p className="text-gray-600">
            Historical figures related to this event will appear here.
          </p>
        </div>

        {/* Related Places */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-3">
            📍 Related Places
          </h2>

          <p className="text-gray-600">
            Locations associated with this event will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}