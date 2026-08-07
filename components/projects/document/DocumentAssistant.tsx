"use client";

import { useState } from "react";
import { Bot, ChevronDown } from "lucide-react";
import DocumentQuestion from "@/components/documents/DocumentQuestion";

type Props = {
  documentId: number;
};

export default function DocumentAssistant({
  documentId,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-[#101b2d] overflow-hidden">

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-white/5"
      >
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-cyan-300" />

          <div className="text-right">
            <p className="font-semibold text-white">
              مساعد أثر البحثي
            </p>

            <p className="text-xs text-slate-500">
              اسأل عن هذا المستند
            </p>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-white/10 p-4">
          <DocumentQuestion
            documentId={documentId}
          />
        </div>
      )}
    </div>
  );
}