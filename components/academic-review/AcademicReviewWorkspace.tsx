"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAs } from "file-saver";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import { Download, LoaderCircle, Trash2 } from "lucide-react";

type ChangeItem = {
  original: string;
  corrected: string;
  reason: string;
  category: string;
};

type ReviewSection = {
  id: number;
  sectionIndex: number;
  startPage: number;
  endPage: number;
  originalText: string;
  reviewedText: string | null;
  changes: string | null;
  processingStatus: string;
};

type Review = {
  id: number;
  name: string;
  reviewLevel: string;
  status: string;
  totalPages: number;
  processedPages: number;
  processingError: string | null;
  sections: ReviewSection[];
};

function readChanges(value: string | null): ChangeItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeFileName(value: string) {
  return value.replace(/\.[^.]+$/, "").replace(/[<>:"/\\|?*]/g, "").trim() || "academic-review";
}

export default function AcademicReviewWorkspace({ review: initialReview }: { review: Review }) {
  const router = useRouter();
  const [review, setReview] = useState(initialReview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function continueProcessing() {
    setBusy(true);
    setError("");
    try {
      let completed = false;
      while (!completed) {
        const response = await fetch(`/api/academic-reviews/${review.id}/process`, { method: "POST", cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر استكمال المراجعة.");
        completed = data.review.status === "COMPLETED";
        setReview((current) => ({ ...current, ...data.review }));
      }
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر استكمال المراجعة.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview() {
    setBusy(true);
    setConfirmingDelete(false);
    setError("");
    const response = await fetch(`/api/academic-reviews/${review.id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/academic-review");
      router.refresh();
      return;
    }
    const data = await response.json();
    setError(data.error || "تعذر حذف المراجعة.");
    setBusy(false);
  }

  async function exportWord() {
    setBusy(true);
    try {
      const paragraphs = review.sections.flatMap((section) => {
        const text = section.reviewedText || section.originalText;
        return text.split(/\n+/).filter(Boolean).map((paragraph) =>
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { after: 140, line: 360 },
            children: [new TextRun({ text: paragraph, font: "Arial", size: 28, rightToLeft: true })],
          })
        );
      });
      const document = new Document({
        creator: "ATHAR AI",
        title: `المراجعة اللغوية - ${review.name}`,
        sections: [{ properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } }, children: paragraphs }],
      });
      saveAs(await Packer.toBlob(document), `${safeFileName(review.name)}-مراجعة-أثر.docx`);
    } catch {
      setError("تعذر إنشاء ملف Word.");
    } finally {
      setBusy(false);
    }
  }

  const progress = review.totalPages > 0 ? Math.round((review.processedPages / review.totalPages) * 100) : 0;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-amber-400/15 bg-[#081526] p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-300">المراجعة اللغوية والأكاديمية للرسائل العلمية</p>
            <h1 className="mt-1 break-words text-2xl font-black sm:text-3xl">{review.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{review.totalPages} صفحة • {review.reviewLevel === "FULL" ? "لغة وصياغة أكاديمية" : "مراجعة لغوية"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {review.status !== "COMPLETED" && <button type="button" onClick={() => void continueProcessing()} disabled={busy} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}استكمال المراجعة</button>}
            {review.status === "COMPLETED" && <button type="button" onClick={() => void exportWord()} disabled={busy} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-bold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-4 w-4" />تنزيل Word</button>}
            <button type="button" onClick={() => setConfirmingDelete(true)} disabled={busy} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm font-bold text-red-200 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4" />حذف</button>
          </div>
        </div>

        {confirmingDelete && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
            <p className="font-bold text-red-200">هل أنتِ متأكدة من حذف هذه المراجعة؟</p>
            <p className="mt-1 break-words text-sm leading-6 text-red-200/70">سيتم حذف ملف «{review.name}» ونتائج مراجعته نهائيًا.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void deleteReview()} disabled={busy} className="cursor-pointer rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">تأكيد الحذف</button>
              <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy} className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50">إلغاء</button>
            </div>
          </div>
        )}
        {review.status === "COMPLETED" ? (
          <p className="mt-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-bold text-emerald-300">اكتملت المراجعة</p>
        ) : (
          <>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-400" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-xs text-slate-500">{review.processedPages} من {review.totalPages} صفحة — {progress}%</p>
          </>
        )}
        {(error || review.processingError) && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-300">{error || review.processingError}</p>}
      </section>

      <div className="space-y-4">
        {review.sections.map((section) => {
          const changes = readChanges(section.changes);
          return (
            <details key={section.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#081526]" open={section.sectionIndex === 0}>
              <summary className="cursor-pointer list-none px-4 py-4 font-bold sm:px-6 [&::-webkit-details-marker]:hidden">الجزء {section.sectionIndex + 1} — الصفحات {section.startPage} إلى {section.endPage}</summary>
              <div className="border-t border-white/10 p-4 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-black/15 p-4"><h2 className="mb-3 text-sm font-bold text-slate-400">النص الأصلي</h2><div className="whitespace-pre-wrap text-sm leading-8 text-slate-400">{section.originalText}</div></div>
                  <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.025] p-4"><h2 className="mb-3 text-sm font-bold text-emerald-300">النص بعد المراجعة</h2><div className="whitespace-pre-wrap text-sm leading-8 text-slate-200">{section.reviewedText || "لم تكتمل مراجعة هذا الجزء بعد."}</div></div>
                </div>
                {changes.length > 0 && <div className="mt-4 space-y-2"><h2 className="font-bold">التعديلات المقترحة ({changes.length})</h2>{changes.map((change, index) => <div key={`${index}-${change.original}`} className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm"><p><span className="text-red-300 line-through">{change.original}</span> ← <span className="text-emerald-300">{change.corrected}</span></p><p className="mt-1 text-xs leading-6 text-slate-500">{change.reason}</p></div>)}</div>}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
