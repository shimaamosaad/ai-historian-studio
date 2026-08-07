"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  Clipboard,
  FileText,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

type Props = {
  documentId: number;
};

type EvidenceItem = {
  text: string;
  page: number | null;
};

type AskResponse = {
  answer?: string;
  page?: number | null;
  pages?: number[];
  quote?: string | null;
  evidence?: EvidenceItem[];
  evidenceCount?: number;
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
  evidence: EvidenceItem[];
  score: number;
};

function cleanEvidence(
  evidence?: EvidenceItem[]
): EvidenceItem[] {
  if (!Array.isArray(evidence)) {
    return [];
  }

  const seen = new Set<string>();

  return evidence
    .filter(
      (item) =>
        item &&
        typeof item.text === "string" &&
        item.text.trim().length > 0
    )
    .map((item) => ({
      text: item.text
        .replace(/\s+/g, " ")
        .trim(),
      page:
        typeof item.page === "number"
          ? item.page
          : null,
    }))
    .filter((item) => {
      const key =
        `${item.page ?? "x"}:${item.text
          .slice(0, 300)
          .toLowerCase()}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function getPages(
  data: AskResponse,
  evidence: EvidenceItem[]
): number[] {
  const directPages = Array.isArray(data.pages)
    ? data.pages.filter(
        (value): value is number =>
          typeof value === "number"
      )
    : [];

  const evidencePages = evidence
    .map((item) => item.page)
    .filter(
      (page): page is number =>
        typeof page === "number"
    );

  const fallbackPage =
    typeof data.page === "number"
      ? [data.page]
      : [];

  return Array.from(
    new Set([
      ...directPages,
      ...evidencePages,
      ...fallbackPage,
    ])
  ).sort((a, b) => a - b);
}

function getConfidenceLabel(
  score: number
): string {
  if (score >= 80) {
    return "دعم قوي من المستند";
  }

  if (score >= 55) {
    return "دعم متوسط من المستند";
  }

  return "الدعم محدود ويحتاج مراجعة";
}

function getConfidenceClass(
  score: number
): string {
  if (score >= 80) {
    return "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300";
  }

  if (score >= 55) {
    return "border-amber-400/15 bg-amber-400/[0.06] text-amber-300";
  }

  return "border-red-400/15 bg-red-400/[0.06] text-red-300";
}

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

  const [copiedKey, setCopiedKey] =
    useState<string | null>(null);

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
    setCopiedKey(null);

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
            question:
              cleanQuestion,
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

      const evidence =
        cleanEvidence(
          data.evidence
        );

      const pages =
        getPages(
          data,
          evidence
        );

      const page =
        typeof data.page ===
        "number"
          ? data.page
          : pages[0] ?? null;

      const quote =
        typeof data.quote ===
        "string"
          ? data.quote.trim()
          : evidence[0]?.text ??
            "";

      const score =
        typeof data.confidence ===
        "number"
          ? data.confidence
          : typeof data.score ===
              "number"
            ? data.score
            : 0;

      const newItem:
        ConversationItem = {
        id: `${Date.now()}-${Math.random()}`,
        question:
          cleanQuestion,
        answer:
          data.answer ||
          "لم يتم العثور على إجابة واضحة.",
        page,
        pages,
        quote,
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

  async function copyText({
    key,
    text,
  }: {
    key: string;
    text: string;
  }) {
    try {
      await navigator.clipboard.writeText(
        text
      );

      setCopiedKey(key);

      window.setTimeout(() => {
        setCopiedKey(null);
      }, 1800);
    } catch {
      setError(
        "تعذر نسخ النص."
      );
    }
  }

  function buildCitationText(
    item: ConversationItem,
    evidence: EvidenceItem
  ) {
    const pageText =
      evidence.page !== null
        ? `الصفحة ${evidence.page}`
        : "صفحة غير محددة";

    return `${evidence.text}\n\nالمصدر: ${pageText}`;
  }

  function clearConversation() {
    setConversation([]);
    setError("");
    setCopiedKey(null);
  }

  return (
    <section
      dir="rtl"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-white">
            اسأل عن هذا المستند
          </h3>

          <p className="mt-1 text-xs leading-6 text-slate-500">
            الإجابات مرتبطة بالنص والصفحات الداعمة داخل المستند.
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
            className="inline-flex items-center gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            مسح السجل
          </button>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
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
              (event.ctrlKey ||
                event.metaKey)
            ) {
              event.preventDefault();

              void askDocument();
            }
          }}
          placeholder="اكتب سؤالك عن هذا المستند..."
          rows={3}
          disabled={loading}
          className="w-full resize-y bg-transparent text-sm leading-7 text-white outline-none placeholder:text-slate-600"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <span className="text-[11px] text-slate-600">
            Ctrl + Enter للإرسال
          </span>

          <button
            type="button"
            onClick={
              askDocument
            }
            disabled={
              loading ||
              !question.trim()
            }
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                جاري البحث
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                اسأل أثر
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {conversation.length >
        0 && (
        <div className="space-y-5">
          {conversation.map(
            (item, index) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/25"
              >
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="text-[11px] font-semibold text-amber-300">
                    السؤال{" "}
                    {index + 1}
                  </p>

                  <p className="mt-1 text-sm leading-7 text-slate-200">
                    {
                      item.question
                    }
                  </p>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-cyan-300" />

                    <h4 className="font-bold text-white">
                      الإجابة
                    </h4>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-200">
                    {item.answer}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.pages.length >
                      0 && (
                      <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-2 text-xs text-cyan-200">
                        <FileText className="h-3.5 w-3.5" />

                        الصفحات:{" "}
                        {item.pages.join(
                          "، "
                        )}
                      </div>
                    )}

                    <div
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${getConfidenceClass(
                        item.score
                      )}`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />

                      {
                        item.score
                      }
                      % —{" "}
                      {getConfidenceLabel(
                        item.score
                      )}
                    </div>
                  </div>

                  {item.evidence
                    .length > 0 ? (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="font-bold text-white">
                          الأدلة والمصادر
                        </h4>

                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-500">
                          {
                            item
                              .evidence
                              .length
                          }{" "}
                          دليل
                        </span>
                      </div>

                      <div className="space-y-3">
                        {item.evidence.map(
                          (
                            evidence,
                            evidenceIndex
                          ) => {
                            const evidenceKey =
                              `${item.id}-${evidenceIndex}`;

                            return (
                              <div
                                key={
                                  evidenceKey
                                }
                                className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                              >
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                  <span className="rounded-lg border border-amber-300/10 bg-amber-300/[0.05] px-2.5 py-1 text-xs font-semibold text-amber-200">
                                    {evidence.page !==
                                    null
                                      ? `الصفحة ${evidence.page}`
                                      : "صفحة غير محددة"}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyText(
                                        {
                                          key: evidenceKey,
                                          text: buildCitationText(
                                            item,
                                            evidence
                                          ),
                                        }
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.06]"
                                  >
                                    {copiedKey ===
                                    evidenceKey ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 text-emerald-300" />
                                        تم النسخ
                                      </>
                                    ) : (
                                      <>
                                        <Clipboard className="h-3.5 w-3.5" />
                                        نسخ الاستشهاد
                                      </>
                                    )}
                                  </button>
                                </div>

                                <p className="text-sm leading-8 text-slate-300">
                                  {
                                    evidence.text
                                  }
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ) : item.quote ? (
                    <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="font-bold text-white">
                          النص المستشهد به
                        </h4>

                        <button
                          type="button"
                          onClick={() =>
                            copyText({
                              key: `${item.id}-quote`,
                              text:
                                item.quote +
                                (item.page !==
                                null
                                  ? `\n\nالمصدر: الصفحة ${item.page}`
                                  : ""),
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.06]"
                        >
                          <Clipboard className="h-3.5 w-3.5" />

                          {copiedKey ===
                          `${item.id}-quote`
                            ? "تم النسخ"
                            : "نسخ الاستشهاد"}
                        </button>
                      </div>

                      <p className="text-sm leading-8 text-slate-300">
                        {
                          item.quote
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}