"use client";

import { useState } from "react";

type Props = {
  documentId: number;
};

type Evidence = {
  text: string;
  page: number | null;
};

type AskResponse = {
  answer?: string;
  page?: number | null;
  pages?: number[];
  evidence?: Evidence[];
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
  evidence: Evidence[];
  score: number;
};

export default function DocumentQuestion({
  documentId,
}: Props) {
  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [conversation, setConversation] =
    useState<ConversationItem[]>([]);

  const [error, setError] =
    useState("");

  const [
    copiedEvidenceId,
    setCopiedEvidenceId,
  ] = useState<string | null>(null);

  async function askDocument() {
    const cleanQuestion =
      question.trim();

    if (
      !cleanQuestion ||
      loading
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setCopiedEvidenceId(null);

    try {
      const response = await fetch(
        `/api/documents/${documentId}/ask`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
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

      const pages = Array.isArray(
        data.pages
      )
        ? data.pages.filter(
            (
              value
            ): value is number =>
              typeof value ===
              "number"
          )
        : page !== null
          ? [page]
          : [];

      const evidence =
        Array.isArray(
          data.evidence
        )
          ? data.evidence
              .filter(
                (
                  item
                ): item is Evidence =>
                  Boolean(item) &&
                  typeof item.text ===
                    "string" &&
                  (
                    item.page ===
                      null ||
                    typeof item.page ===
                      "number"
                  )
              )
              .map((item) => ({
                text:
                  item.text.trim(),

                page:
                  item.page,
              }))
              .filter(
                (item) =>
                  item.text.length >
                  0
              )
          : [];

      const score =
        typeof data.confidence ===
        "number"
          ? data.confidence
          : typeof data.score ===
              "number"
            ? data.score
            : 0;

      const newItem: ConversationItem =
        {
          id: `${Date.now()}-${Math.random()}`,

          question:
            cleanQuestion,

          answer,

          page,

          pages,

          evidence,

          score,
        };

      setConversation(
        (current) => [
          ...current,
          newItem,
        ]
      );

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

  async function copyEvidence(
    conversationId: string,
    evidenceIndex: number,
    evidence: Evidence
  ) {
    if (!evidence.text) {
      return;
    }

    try {
      const pageText =
        evidence.page !== null
          ? `الصفحة: ${evidence.page}`
          : "رقم الصفحة غير متوفر";

      const citationText =
        `${evidence.text}\n\n${pageText}`;

      await navigator.clipboard.writeText(
        citationText
      );

      const copyId =
        `${conversationId}-${evidenceIndex}`;

      setCopiedEvidenceId(
        copyId
      );

      window.setTimeout(() => {
        setCopiedEvidenceId(
          null
        );
      }, 2000);
    } catch {
      setError(
        "تعذر نسخ الدليل."
      );
    }
  }

  async function copyAnswer(
    item: ConversationItem
  ) {
    if (!item.answer) {
      return;
    }

    try {
      const pagesText =
        item.pages.length > 0
          ? `الصفحات المستخدمة: ${item.pages.join(
              "، "
            )}`
          : item.page !== null
            ? `الصفحة المستخدمة: ${item.page}`
            : "الصفحات المستخدمة غير متوفرة";

      const answerText =
        `${item.answer}\n\n${pagesText}`;

      await navigator.clipboard.writeText(
        answerText
      );

      const copyId =
        `${item.id}-answer`;

      setCopiedEvidenceId(
        copyId
      );

      window.setTimeout(() => {
        setCopiedEvidenceId(
          null
        );
      }, 2000);
    } catch {
      setError(
        "تعذر نسخ الإجابة."
      );
    }
  }

  function clearConversation() {
    setConversation([]);
    setError("");
    setCopiedEvidenceId(
      null
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 text-xl font-bold text-white">
            🤖 مساعد أثر البحثي
          </h2>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            اكتب سؤالك، وسيبحث أثر في المستند
            كاملًا، ويجمع المعلومات من الصفحات
            المختلفة، ثم يقدم إجابة أكاديمية
            مدعومة بالأدلة.
          </p>
        </div>

        {conversation.length >
          0 && (
          <button
            type="button"
            onClick={
              clearConversation
            }
            disabled={loading}
            className="rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            مسح سجل الأسئلة
          </button>
        )}
      </div>

      <textarea
        value={question}
        onChange={(event) =>
          setQuestion(
            event.target.value
          )
        }
        onKeyDown={(event) => {
          if (
            event.key ===
              "Enter" &&
            (
              event.ctrlKey ||
              event.metaKey
            )
          ) {
            event.preventDefault();

            void askDocument();
          }
        }}
        placeholder="مثال: حلل العلاقة بين الشخصيات والأحداث الواردة في المستند."
        className="mt-5 w-full resize-y rounded-lg border border-slate-600 bg-slate-800 p-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
        rows={4}
        disabled={loading}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={
            askDocument
          }
          disabled={
            loading ||
            !question.trim()
          }
          className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "جاري البحث والتحليل..."
            : "اسأل المستند"}
        </button>

        <span className="text-xs text-slate-500">
          Ctrl + Enter للإرسال
        </span>
      </div>

      {loading && (
        <div className="mt-5 rounded-lg border border-blue-500/20 bg-blue-950/20 p-4 text-sm text-blue-200">
          يقوم أثر الآن بقراءة المقاطع المرتبطة
          بالسؤال وتحليلها باستخدام الذكاء
          الاصطناعي...
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {conversation.length >
        0 && (
        <div className="mt-8 space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-bold text-white">
              سجل الأسئلة والإجابات
            </h3>

            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {
                conversation.length
              }{" "}
              سؤال
            </span>
          </div>

          {conversation.map(
            (
              item,
              index
            ) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-slate-950/45 p-5"
              >
                <div className="rounded-xl border border-amber-400/20 bg-amber-950/15 p-4">
                  <p className="mb-2 text-xs font-bold text-amber-300">
                    سؤال الباحث{" "}
                    {index + 1}
                  </p>

                  <p className="leading-7 text-white">
                    {
                      item.question
                    }
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-bold text-cyan-300">
                      🤖 إجابة أثر
                    </h4>

                    <button
                      type="button"
                      onClick={() =>
                        copyAnswer(
                          item
                        )
                      }
                      className="rounded-lg bg-cyan-950/50 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-900/60"
                    >
                      {copiedEvidenceId ===
                      `${item.id}-answer`
                        ? "✓ تم نسخ الإجابة"
                        : "📋 نسخ الإجابة"}
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap leading-8 text-slate-100">
                    {
                      item.answer
                    }
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">
                      📄 الصفحات
                      المستخدمة
                    </p>

                    <p className="mt-2 text-xl font-bold text-white">
                      {item.pages
                        .length >
                      0
                        ? item.pages.join(
                            "، "
                          )
                        : item.page !==
                            null
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
                        item.score >=
                        80
                          ? "text-green-400"
                          : item.score >=
                              50
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {
                        item.score
                      }
                      %
                    </p>
                  </div>
                </div>

                {item.evidence
                  .length >
                  0 && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-slate-800/80 p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white">
                          📚 الأدلة
                          المستخرجة من
                          المستند
                        </h4>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          النصوص التالية
                          نُقحت آليًا
                          لتحسين القراءة
                          مع الحفاظ على
                          المعنى الوارد في
                          المستند.
                        </p>
                      </div>

                      <span className="rounded-full border border-blue-400/15 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                        {
                          item
                            .evidence
                            .length
                        }{" "}
                        دليل
                      </span>
                    </div>

                    <div className="space-y-4">
                      {item.evidence.map(
                        (
                          evidence,
                          evidenceIndex
                        ) => {
                          const copyId =
                            `${item.id}-${evidenceIndex}`;

                          return (
                            <div
                              key={
                                copyId
                              }
                              className="rounded-xl border border-blue-400/10 bg-slate-900/80 p-4"
                            >
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                                    الدليل{" "}
                                    {
                                      evidenceIndex +
                                      1
                                    }
                                  </span>

                                  <span className="text-sm font-semibold text-slate-300">
                                    {evidence.page !==
                                    null
                                      ? `📄 الصفحة ${evidence.page}`
                                      : "📄 الصفحة غير متوفرة"}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyEvidence(
                                      item.id,
                                      evidenceIndex,
                                      evidence
                                    )
                                  }
                                  className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                                >
                                  {copiedEvidenceId ===
                                  copyId
                                    ? "✓ تم النسخ"
                                    : "📋 نسخ الدليل"}
                                </button>
                              </div>

                              <p className="whitespace-pre-wrap border-r-4 border-blue-500 pr-4 leading-8 text-slate-300">
                                {
                                  evidence.text
                                }
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div className="mt-4 rounded-lg border border-emerald-400/10 bg-emerald-400/5 p-3 text-xs leading-6 text-emerald-200">
                      استخدم أثر{" "}
                      {
                        item
                          .evidence
                          .length
                      }{" "}
                      من الأدلة المرتبطة
                      بالسؤال لبناء هذه
                      الإجابة.
                    </div>
                  </div>
                )}

                {item.evidence
                  .length ===
                  0 && (
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/20 p-4 text-sm leading-6 text-amber-300">
                    تم إنشاء الإجابة، لكن
                    لم تتوافر أدلة نصية
                    واضحة بما يكفي
                    لعرضها بصورة منفصلة.
                  </div>
                )}

                {item.pages
                  .length ===
                  0 &&
                  item.page ===
                    null && (
                    <p className="mt-4 text-sm text-amber-300">
                      رقم الصفحة غير
                      متوفر لهذا المستند؛
                      غالبًا تم رفعه قبل
                      إضافة ميزة ترقيم
                      الصفحات.
                    </p>
                  )}
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}