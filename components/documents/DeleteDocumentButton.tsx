"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  documentId: number;
  documentName: string;
};

export default function DeleteDocumentButton({
  documentId,
  documentName,
}: Props) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteDocument() {
    const confirmed = window.confirm(
      `هل أنتِ متأكدة من حذف المستند:\n${documentName}؟`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "تعذر حذف المستند"
        );
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حذف المستند"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={deleteDocument}
        disabled={deleting}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "جاري الحذف..." : "🗑 حذف المستند"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}