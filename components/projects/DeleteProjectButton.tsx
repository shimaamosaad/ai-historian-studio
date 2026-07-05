"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  projectId: number;
};

export default function DeleteProjectButton({ projectId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذه العملية."
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error();
      }

      router.push("/projects");
      router.refresh();
    } catch {
      alert("حدث خطأ أثناء حذف المشروع.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? "جارٍ الحذف..." : "🗑 حذف المشروع"}
    </button>
  );
}