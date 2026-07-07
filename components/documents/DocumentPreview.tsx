"use client";

type Props = {
  fileUrl: string | null;
  onClose: () => void;
};

export default function DocumentPreview({
  fileUrl,
  onClose,
}: Props) {
  if (!fileUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">
            Document Preview
          </h2>

          <button
            onClick={onClose}
            className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700"
          >
            ✕ Close
          </button>
        </div>

        <iframe
          src={fileUrl}
          className="h-full w-full"
          title="Document Preview"
        />
      </div>
    </div>
  );
}