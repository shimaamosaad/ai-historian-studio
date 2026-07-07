type PageProps = {
  params: Promise<{
    name: string;
  }>;
};

export default async function PersonPage({ params }: PageProps) {
  const { name } = await params;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">
        👤 {decodeURIComponent(name)}
      </h1>

      <div className="border rounded-xl p-5 bg-white">
        <h2 className="text-xl font-semibold mb-2">
          Person Profile
        </h2>

        <p className="text-gray-600">
          AI-generated information about this historical figure will appear here.
        </p>
      </div>
    </div>
  );
}