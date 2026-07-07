"use client";

import DocumentCard from "./DocumentCard";

type Props = {
  documents: any[];
  onDelete: (id: number) => void;
  onPreview: (url: string) => void;
};

export default function DocumentList({
  documents,
  onDelete,
  onPreview,
}: Props) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}