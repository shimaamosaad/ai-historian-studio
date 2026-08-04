"use client";

import { useState } from "react";

type Props = {
  documentId: number;
};

type AskResponse = {
  answer?: string;
  page?: number | null;
  pages?: number[];
  quote?: string | null;
  score?: number;
  confidence?: number;
  error?: string;
};

type ConversationItem = {
  id: string;
  question: string;
  answer: string;
  page: number | null;
  pages: number[];
  quote: string;
  score: number;
};

export default function DocumentQuestion({
  documentId,
}: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<
    ConversationItem[]
  >([]);
  const [error, setError] = useState("");
  const [copiedItemId, setCopiedItemId] =
    useState<string | null>(null);

  async function askDocument() {
    const cleanQuestion = question.trim();

    if (!cleanQuestion || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setCopiedItemId(null);

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

      const answer =
        data.answer ||
        "لم يتم العثور على إجابة واضحة.";

      const page =
        typeof data.page === "number"
          ? data.page
          : null;

      const pages = Array.isArray(data.pages)
        ? data.pages.filter(
            (value): value is number =>
              typeof value === "number"
          )
        : page !== null
          ? [page]
          : [];

      const quote =
        typeof data.quote === "string"
          ? data.quote
          : "";

      const score =
        typeof data.confidence === "number"
          ? data.confidence
          : typeof data.score === "number"
            ? data.score
            : 0;

      const newItem: ConversationItem = {
        id: `${Date.now()}-${Math.random()}`,
        question: cleanQuestion,
        answer,
        page,
        pages,
        quote,
        score,
      };

      setConversation((current) => [
        ...current,
        newItem,
      ]);

      setQuestion("");
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

  async function copyQuote(
    item: ConversationItem
  ) {
    if (!item.quote) {
      return;
    }

    try {
      const pagesText =
        item.pages.length > 0
          ? `الصفحات: ${item.pages.join("، ")}`
          : item.page !== null
            ? `الصفحة: ${item.page}`
            : "";

      const citationText = pagesText
        ? `${item.quote}\n\n${pagesText}`
        : item.quote;

      await navigator.clipboard.writeText(
        citationText
      );

      setCopiedItemId(item.id);

      window.setTimeout(() => {
        setCopiedItemId(null);
      }, 2000);
    } catch {
      setError("تعذر نسخ الاقتباس.");
    }
  }

  function clearConversation() {
    setConversation([]);
    setError("");
    setCopiedItemId(null);
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 text-xl font-bold text-white">
            💬 اسأل المستند
          </h2>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            اكتب سؤالك، وسيبحث أثر في المستند
            كاملًا، ويجمع الأدلة من الصفحات، ثم
            يقدم إجابة موثقة بالمصادر.
          </p>
        </div>

        {conversation.length > 0 && (
          <button
            type="button"
            onClick={clearConversation}
            disabled={loading}
            className="rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
          >
            مسح سجل الأسئلة
          </button>
        )}
      </div>

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
        className="mt-5 w-full resize-y rounded-lg border border-slate-600 bg-slate-800 p-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
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

      {conversation.length > 0 && (
        <div className="mt-8 space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white">
              سجل الأسئلة والإجابات
            </h3>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {conversation.length} سؤال
            </span>
          </div>

          {conversation.map((item, index) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"
            >
              <div className="rounded-xl border border-amber-400/20 bg-amber-950/15 p-4">
                <p className="mb-2 text-xs font-bold text-amber-300">
                  السؤال {index + 1}
                </p>

                <p className="leading-7 text-white">
                  {item.question}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-5">
                <h4 className="mb-3 font-bold text-cyan-300">
                  📌 الإجابة
                </h4>

                <p className="whitespace-pre-wrap leading-8 text-slate-100">
                  {item.answer}
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">
                    📄 الصفحات المستخدمة
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {item.pages.length > 0
                      ? item.pages.join("، ")
                      : item.page !== null
                        ? item.page
                        : "غير متوفرة"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
                  <p className="text-sm text-slate-400">
                    🎯 درجة الثقة
                  </p>

                  <p
                    className={`mt-2 text-2xl font-bold ${
                      item.score >= 80
                        ? "text-green-400"
                        : item.score >= 50
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {item.score}%
                  </p>
                </div>
              </div>

              {item.quote && (
                <div className="mt-4 rounded-xl border border-white/10 bg-slate-800 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-bold text-white">
                      📖 النص المستشهد به
                    </h4>

                    <button
                      type="button"
                      onClick={() =>
                        copyQuote(item)
                      }
                      className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                    >
                      {copiedItemId === item.id
                        ? "✓ تم النسخ"
                        : "📋 نسخ الاقتباس"}
                    </button>
                  </div>

                  <blockquote className="whitespace-pre-wrap border-r-4 border-cyan-500 pr-4 leading-8 text-slate-300">
                    {item.quote}
                  </blockquote>
                </div>
              )}

              {item.pages.length === 0 &&
                item.page === null && (
                  <p className="mt-4 text-sm text-amber-300">
                    رقم الصفحة غير متوفر لهذا
                    المستند؛ غالبًا تم رفعه قبل
                    إضافة ميزة ترقيم الصفحات.
                  </p>
                )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}