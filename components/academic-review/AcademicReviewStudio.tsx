"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { BookCheck, FileText, LoaderCircle, UploadCloud } from "lucide-react";

type ReviewItem = {
  id: number;
  name: string;
  fileType: string;
  reviewLevel: string;
  status: string;
  totalPages: number;
  processedPages: number;
  processingError?: string | null;
  createdAt: string;
};

export default function AcademicReviewStudio({
  initialReviews,
  remainingPages,
}: {
  initialReviews: ReviewItem[];
  remainingPages: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reviews, setReviews] = useState(initialReviews);
  const [file, setFile] = useState<File | null>(null);
  const [reviewLevel, setReviewLevel] = useState("FULL");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function continueProcessing(reviewId: number) {
    setBusy(true);
    setError("");
    try {
      let completed = false;
      while (!completed) {
        const response = await fetch(`/api/academic-reviews/${reviewId}/process`, {
          method: "POST",
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر استكمال المراجعة.");

        const updated = data.review as ReviewItem;
        setReviews((current) =>
          current.map((item) => (item.id === reviewId ? { ...item, ...updated } : item))
        );
        setMessage(`جارٍ المراجعة: ${updated.processedPages} من ${updated.totalPages} صفحة`);
        completed = updated.status === "COMPLETED";
      }
      setMessage("اكتملت المراجعة اللغوية بنجاح.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر استكمال المراجعة.");
    } finally {
      setBusy(false);
    }
  }

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setMessage("جارٍ رفع الملف وتجهيزه...");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("reviewLevel", reviewLevel);
      const response = await fetch("/api/academic-reviews", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر رفع الملف.");

      const created = { ...data.review, fileType: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx", reviewLevel, createdAt: new Date().toISOString() };
      setReviews((current) => [created, ...current]);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setBusy(false);
      await continueProcessing(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر رفع الملف.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-amber-400/15 bg-[#081526] shadow-2xl shadow-black/20">
        <div className="border-b border-white/10 p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><BookCheck /></span>
            <div>
              <p className="text-sm font-bold text-amber-300">أداة متخصصة للباحثين</p>
              <h1 className="mt-1 text-2xl font-black sm:text-4xl">المراجعة اللغوية والأكاديمية للرسائل العلمية</h1>
              <p className="mt-2 text-sm leading-7 text-slate-400">صحّحي اللغة والصياغة الأكاديمية مع الحفاظ على المعنى والمراجع والاقتباسات.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:p-7 lg:grid-cols-[1fr_280px]">
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="flex min-h-32 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-400/25 bg-amber-400/[0.035] p-5 text-center transition hover:bg-amber-400/[0.07] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud className="h-7 w-7 shrink-0 text-amber-300" />
              <span className="min-w-0">
                <span className="block break-words font-bold">{file ? file.name : "اختاري ملف وورد أو بي دي إف"}</span>
                <span className="mt-1 block text-xs text-slate-500">الصيغ المدعومة: DOCX وPDF — يظل الملف الأصلي محفوظًا دون تعديل</span>
              </span>
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">مستوى المراجعة</label>
            <select value={reviewLevel} onChange={(event) => setReviewLevel(event.target.value)} disabled={busy} className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-[#0b1a2c] px-4 text-sm outline-none disabled:cursor-not-allowed">
              <option value="FULL">لغة وصياغة أكاديمية</option>
              <option value="LANGUAGE">لغة وإملاء فقط</option>
            </select>
            <p className="text-xs text-slate-500">رصيدك الحالي: {remainingPages} صفحة</p>
            <button type="button" onClick={upload} disabled={!file || busy} className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
              رفع وبدء المراجعة
            </button>
          </div>
        </div>

        {(message || error) && <div className={`mx-4 mb-5 rounded-xl border px-4 py-3 text-sm sm:mx-7 ${error ? "border-red-400/20 bg-red-400/[0.06] text-red-300" : "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-200"}`}>{error || message}</div>}
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#081526]">
        <div className="border-b border-white/10 px-5 py-4"><h2 className="text-xl font-black">ملفات المراجعة</h2></div>
        <div className="space-y-3 p-4 sm:p-6">
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">لم ترفعي ملفًا للمراجعة بعد.</p>
          ) : reviews.map((review) => {
            const progress = review.totalPages > 0 ? Math.round((review.processedPages / review.totalPages) * 100) : 0;
            return (
              <article key={review.id} className="rounded-2xl border border-white/10 bg-[#0b1a2c] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <FileText className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
                    <div className="min-w-0"><h3 className="break-words font-bold">{review.name}</h3><p className="mt-1 text-xs text-slate-500">{review.totalPages} صفحة • {review.reviewLevel === "FULL" ? "لغة وصياغة أكاديمية" : "مراجعة لغوية"}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {review.status !== "COMPLETED" && <button type="button" disabled={busy} onClick={() => void continueProcessing(review.id)} className="cursor-pointer rounded-lg border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-200 disabled:cursor-not-allowed disabled:opacity-40">{review.status === "FAILED" ? "إعادة المحاولة" : "استكمال"}</button>}
                    <Link href={`/academic-review/${review.id}`} className="cursor-pointer rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200">عرض المراجعة</Link>
                  </div>
                </div>
                {review.status === "COMPLETED" ? (
                  <p className="mt-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-bold text-emerald-300">اكتملت المراجعة</p>
                ) : (
                  <>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-400" style={{ width: `${progress}%` }} /></div>
                    <p className="mt-2 text-xs text-slate-500">{review.processedPages} من {review.totalPages} صفحة</p>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
