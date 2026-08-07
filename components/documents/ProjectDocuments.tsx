"use client";

import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import DocumentUpload from "./DocumentUpload";

type Props = {
  projectId: number;
};

export default function ProjectDocuments({
  projectId,
}: Props) {
  const router = useRouter();

  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#081526]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/15 bg-amber-300/[0.06] text-amber-300">
            <UploadCloud className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-bold text-white">
              رفع مستند جديد
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              PDF أو Word للتحليل والاستخراج التلقائي
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <DocumentUpload
          projectId={projectId}
          onUploaded={() => {
            router.refresh();
          }}
        />
      </div>
    </section>
  );
}