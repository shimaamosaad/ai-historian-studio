"use client";

import { useRouter } from "next/navigation";
import DocumentUpload from "./DocumentUpload";

type Props = {
  projectId: number;
};

export default function ProjectDocuments({
  projectId,
}: Props) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

      <h2 className="mb-2 text-2xl font-bold text-white">
        📄 Upload Historical Document
      </h2>

      <p className="mb-6 text-slate-400">
        ارفع ملف PDF أو Word ليتم تحليله واستخراج الكيانات
        والعلاقات التاريخية تلقائياً.
      </p>

      <DocumentUpload
        projectId={projectId}
        onUploaded={() => {
          router.refresh();
        }}
      />

    </div>
  );
}