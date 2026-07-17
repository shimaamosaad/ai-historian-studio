"use client";

import { useState } from "react";

type Props = {
  documentId: number;
};

type AskResponse = {
  answer?: string;
  page?: number | null;
  quote?: string | null;
  score?: number;
  error?: string;
};

export default function DocumentQuestion({
  documentId,
}: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [page, setPage] = useState<number | null>(null);
  const [quote, setQuote] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function askDocument() {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || loading) {
      return;
    }

    setLoading(true);
    setAnswer("");
    setPage(null);
    setQuote("");
    setError("");
    setCopied(false);

    try {
      const response = await fetch(
        `/api/documents/${documentId}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: cleanQuestion,
          }),
        }
      );

      const data: AskResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "حدث خطأ أثناء البحث داخل المستند"
        );
      }

      setAnswer(
        data.answer ||
          "لم يتم العثور على إجابة واضحة."
      );

      setPage(
        typeof data.page === "number"
          ? data.page
          : null
      );

      setQuote(
        typeof data.quote === "string"
          ? data.quote
          : ""
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء البحث."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyQuote() {
    if (!quote) {
      return;
    }

    try {
      const citationText =
        page !== null
          ? `${quote}\n\nالصفحة: ${page}`
          : quote;

      await navigator.clipboard.writeText(
        citationText
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("تعذر نسخ الاقتباس.");
    }
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <h2 className="mb-2 text-xl font-bold text-white">
        💬 اسأل المستند
      </h2>

      <p className="mb-4 text-sm leading-6 text-slate-400">
        اكتب سؤالًا، وسيبحث أثر عن أفضل مقطع
        مرتبط به داخل المستند.
      </p>

      <textarea
        value={question}
        onChange={(event) =>
          setQuestion(event.target.value)
        }
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey)
          ) {
            event.preventDefault();
            void askDocument();
          }
        }}
        placeholder="مثال: ما دور سبايا الحروب في المجتمع؟"
        className="w-full resize-y rounded-lg border border-slate-600 bg-slate-800 p-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
        rows={4}
        disabled={loading}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={askDocument}
          disabled={loading || !question.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "جاري البحث..."
            : "بحث داخل المستند"}
        </button>

        <span className="text-xs text-slate-500">
          Ctrl + Enter للبحث
        </span>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {answer && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-5">
            <h3 className="mb-3 font-bold text-cyan-300">
              📌 الإجابة
            </h3>

            <p className="whitespace-pre-wrap leading-8 text-slate-100">
              {answer}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
              <p className="text-sm text-slate-400">
                📄 الصفحة
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {page !== null
                  ? page
                  : "غير متوفرة"}
              </p>
            </div>

            {quote && (
              <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-white">
                    📖 النص المستشهد به
                  </h3>

                  <button
                    type="button"
                    onClick={copyQuote}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                  >
                    {copied
                      ? "✓ تم النسخ"
                      : "📋 نسخ الاقتباس"}
                  </button>
                </div>

                <blockquote className="whitespace-pre-wrap border-r-4 border-cyan-500 pr-4 leading-8 text-slate-300">
                  {quote}
                </blockquote>
              </div>
            )}
          </div>

          {page === null && (
            <p className="text-sm text-amber-300">
              رقم الصفحة غير متوفر لهذا المستند؛
              غالبًا تم رفعه قبل إضافة ميزة ترقيم
              الصفحات.
            </p>
          )}
        </div>
      )}
    </section>
  );
}