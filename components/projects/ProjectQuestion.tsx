"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  Clipboard,
  FileSearch,
  Files,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

type Props = {
  projectId: number;
  documentCount: number;
};

type ProjectEvidence = {
  documentId: number;
  documentName: string;
  page: number | null;
  text: string;
  score?: number;
};

type AskResponse = {
  answer?: string;
  evidence?: ProjectEvidence[];
  confidence?: number;
  documentCount?: number;
  sourceDocumentCount?: number;
  error?: string;
};

type ConversationItem = {
  id: string;
  question: string;
  answer: string;
  evidence: ProjectEvidence[];
  confidence: number;
  searchedDocumentCount: number;
  sourceDocumentCount: number;
};

function cleanEvidence(
  evidence?: ProjectEvidence[]
): ProjectEvidence[] {
  if (!Array.isArray(evidence)) {
    return [];
  }

  return evidence.filter(
    (item) =>
      item &&
      typeof item.documentId === "number" &&
      typeof item.documentName === "string" &&
      typeof item.text === "string" &&
      item.text.trim().length > 0
  );
}

function getConfidenceLabel(
  confidence: number
): string {
  if (confidence >= 80) {
    return "دعم قوي من المصادر";
  }

  if (confidence >= 55) {
    return "دعم متوسط من المصادر";
  }

  return "الدعم محدود ويحتاج مراجعة";
}

function confidenceClass(
  confidence: number
): string {
  if (confidence >= 80) {
    return "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300";
  }

  if (confidence >= 55) {
    return "border-amber-400/15 bg-amber-400/[0.06] text-amber-300";
  }

  return "border-red-400/15 bg-red-400/[0.06] text-red-300";
}

export default function ProjectQuestion({
  projectId,
  documentCount,
}: Props) {
  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [conversation, setConversation] =
    useState<ConversationItem[]>([]);

  const [copiedKey, setCopiedKey] =
    useState<string | null>(null);

  async function askProject() {
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
        `/api/projects/${projectId}/ask`,
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
            "تعذر البحث داخل المشروع."
        );
      }

      setConversation(
        (current) => [
          ...current,
          {
            id: `${Date.now()}-${Math.random()}`,
            question:
              cleanQuestion,
            answer:
              data.answer ||
              "لم يتم العثور على إجابة واضحة.",
            evidence:
              cleanEvidence(
                data.evidence
              ),
            confidence:
              typeof data.confidence ===
              "number"
                ? data.confidence
                : 0,
            searchedDocumentCount:
              typeof data.documentCount ===
              "number"
                ? data.documentCount
                : documentCount,
            sourceDocumentCount:
              typeof data.sourceDocumentCount ===
              "number"
                ? data.sourceDocumentCount
                : 0,
          },
        ]
      );

      setQuestion("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء البحث داخل المشروع."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyCitation({
    key,
    evidence,
  }: {
    key: string;
    evidence: ProjectEvidence;
  }) {
    const page =
      evidence.page !== null
        ? `، ص ${evidence.page}`
        : "";

    const text =
      `${evidence.text}\n\nالمصدر: ${evidence.documentName}${page}`;

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
        "تعذر نسخ الاستشهاد."
      );
    }
  }

  return (
    <section
      id="project-research-assistant"
      dir="rtl"
      className="mt-8 overflow-hidden rounded-3xl border border-amber-400/15 bg-[#081526] shadow-2xl shadow-black/20"
    >
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/[0.07] text-amber-300">
              <Files className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold text-amber-300">
                مساعد أثر البحثي
              </p>

              <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                اسأل المشروع بالكامل
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-7 text-slate-400">
                يبحث أثر في جميع المستندات المكتملة، ويجمع المعلومات من أكثر من مصدر ثم يقدم تحليلًا تاريخيًا مستفيضًا مع الأدلة والصفحات.
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
            <FileSearch className="h-3.5 w-3.5" />
            {documentCount} مستند في المشروع
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
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
                void askProject();
              }
            }}
            disabled={loading}
            rows={4}
            placeholder="مثال: حلل تطور الصراع السياسي بين الشخصيات الواردة في مصادر المشروع، وبيّن أسبابه ونتائجه."
            className="academic-text w-full resize-y bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
            <p className="text-xs text-slate-600">
              يبحث في كل المستندات المكتملة — Ctrl + Enter للإرسال
            </p>

            <button
              type="button"
              onClick={
                askProject
              }
              disabled={
                loading ||
                !question.trim() ||
                documentCount === 0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  جاري البحث والتحليل
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  اسأل المشروع
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {conversation.length >
          0 && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-white">
                نتائج البحث في المشروع
              </h3>

              <button
                type="button"
                onClick={() => {
                  setConversation(
                    []
                  );
                  setCopiedKey(
                    null
                  );
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                مسح النتائج
              </button>
            </div>

            {conversation.map(
              (item, index) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/20"
                >
                  <div className="border-b border-white/[0.06] px-5 py-4">
                    <p className="text-xs font-semibold text-amber-300">
                      السؤال{" "}
                      {index + 1}
                    </p>

                    <p className="mt-1 leading-7 text-slate-100">
                      {
                        item.question
                      }
                    </p>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-cyan-300" />

                      <h4 className="font-bold text-white">
                        التحليل البحثي
                      </h4>
                    </div>

                    <div className="academic-text reading-width mt-4 whitespace-pre-wrap">
                      {
                        item.answer
                      }
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-2 text-xs text-cyan-200">
                        <Files className="h-3.5 w-3.5" />
                        استُخدمت أدلة من{" "}
                        {
                          item.sourceDocumentCount
                        }{" "}
                        مستند
                      </div>

                      <div
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${confidenceClass(
                          item.confidence
                        )}`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />

                        {
                          item.confidence
                        }
                        % —{" "}
                        {getConfidenceLabel(
                          item.confidence
                        )}
                      </div>
                    </div>

                    {item.evidence
                      .length > 0 && (
                      <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h4 className="font-bold text-white">
                            الأدلة والمصادر
                          </h4>

                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-500">
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
                              const key =
                                `${item.id}-${evidenceIndex}`;

                              return (
                                <div
                                  key={
                                    key
                                  }
                                  className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                                >
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap gap-2">
                                      <span className="rounded-lg border border-amber-300/10 bg-amber-300/[0.05] px-2.5 py-1 text-xs font-semibold text-amber-200">
                                        {
                                          evidence.documentName
                                        }
                                      </span>

                                      <span className="rounded-lg border border-cyan-300/10 bg-cyan-300/[0.05] px-2.5 py-1 text-xs font-semibold text-cyan-200">
                                        {evidence.page !==
                                        null
                                          ? `الصفحة ${evidence.page}`
                                          : "صفحة غير محددة"}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyCitation(
                                          {
                                            key,
                                            evidence,
                                          }
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/[0.06]"
                                    >
                                      {copiedKey ===
                                      key ? (
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
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}