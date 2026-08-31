"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  BookOpen,
  FileSearch,
  Files,
  LoaderCircle,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

type Props = {
  projectId: number;
  documentCount: number;
};

type AskResponse = {
  answer?: string;
  conversationId?: number;
  confidence?: number;
  documentCount?: number;
  sourceDocumentCount?: number;
  error?: string;
};

type StoredMessage = {
  id: number;
  role: string;
  content: string;
  confidence?: number | null;
  sourceDocumentCount?: number | null;
};

type ConversationResponse = {
  conversation?: {
    id: number;
    title?: string | null;
    messages: StoredMessage[];
  } | null;
  error?: string;
};

type ConversationItem = {
  id: string;
  question: string;
  answer: string;
  confidence: number;
  sourceDocumentCount: number;
};

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

function pairMessages(
  messages: StoredMessage[]
): ConversationItem[] {
  const items:
    ConversationItem[] = [];

  let pendingQuestion:
    StoredMessage | null = null;

  for (const message of messages) {
    if (
      message.role === "user"
    ) {
      pendingQuestion =
        message;

      continue;
    }

    if (
      message.role ===
        "assistant" &&
      pendingQuestion
    ) {
      items.push({
        id:
          `${pendingQuestion.id}-${message.id}`,

        question:
          pendingQuestion.content,

        answer:
          message.content,

        confidence:
          message.confidence ??
          0,

        sourceDocumentCount:
          message.sourceDocumentCount ??
          0,
      });

      pendingQuestion = null;
    }
  }

  return items;
}

export default function ProjectQuestion({
  projectId,
  documentCount,
}: Props) {
  const [question, setQuestion] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    loadingConversation,
    setLoadingConversation,
  ] = useState(true);

  const [error, setError] =
    useState("");

  const [
    conversationId,
    setConversationId,
  ] =
    useState<number | null>(
      null
    );

  const [
    conversation,
    setConversation,
  ] =
    useState<
      ConversationItem[]
    >([]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      try {
        setLoadingConversation(
          true
        );

        const response =
          await fetch(
            `/api/projects/${projectId}/conversations`,
            {
              cache:
                "no-store",
            }
          );

        const data:
          ConversationResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "تعذر تحميل المحادثة."
          );
        }

        if (cancelled) {
          return;
        }

        if (
          data.conversation
        ) {
          setConversationId(
            data.conversation.id
          );

          setConversation(
            pairMessages(
              data.conversation.messages
            )
          );
        } else {
          setConversationId(
            null
          );

          setConversation(
            []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "تعذر تحميل المحادثة."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingConversation(
            false
          );
        }
      }
    }

    void loadConversation();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

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

    try {
      const response =
        await fetch(
          `/api/projects/${projectId}/ask`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                question:
                  cleanQuestion,

                conversationId,
              }),
          }
        );

      const data:
        AskResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر البحث داخل المشروع."
        );
      }

      if (
        typeof data.conversationId ===
        "number"
      ) {
        setConversationId(
          data.conversationId
        );
      }

      setConversation(
        (current) => [
          ...current,
          {
            id:
              `${Date.now()}-${Math.random()}`,

            question:
              cleanQuestion,

            answer:
              data.answer ||
              "لم يتم العثور على إجابة واضحة.",

            confidence:
              typeof data.confidence ===
              "number"
                ? data.confidence
                : 0,

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

  async function startNewConversation() {
    if (loading) {
      return;
    }

    try {
      setError("");

      const response =
        await fetch(
          `/api/projects/${projectId}/conversations`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر إنشاء محادثة جديدة."
        );
      }

      setConversationId(
        data.conversation.id
      );

      setConversation([]);
      setQuestion("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "تعذر إنشاء محادثة جديدة."
      );
    }
  }

  async function deleteConversation() {
    if (
      !conversationId ||
      loading
    ) {
      setConversation([]);
      return;
    }

    try {
      setError("");

      const response =
        await fetch(
          `/api/projects/${projectId}/conversations?conversationId=${conversationId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر حذف المحادثة."
        );
      }

      setConversationId(
        null
      );

      setConversation([]);
      setQuestion("");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "تعذر حذف المحادثة."
      );
    }
  }

  return (
    <section
      id="project-research-assistant"
      dir="rtl"
      className="mt-6 overflow-hidden rounded-2xl sm:mt-8 sm:rounded-3xl border border-amber-400/15 bg-[#081526] shadow-2xl shadow-black/20"
    >
      <div className="border-b border-white/10 px-4 py-5 sm:px-6">
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
                يتذكر أثر محادثتك داخل المشروع حتى بعد إغلاق الصفحة، ويبحث في جميع المستندات المكتملة مع الاستشهادات داخل الإجابة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
              <FileSearch className="h-3.5 w-3.5" />
              {documentCount} مستند
            </div>

            <button
              type="button"
              onClick={
                startNewConversation
              }
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-40"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              محادثة جديدة
            </button>

            <button
              type="button"
              onClick={
                deleteConversation
              }
              disabled={
                loading ||
                conversation.length ===
                  0
              }
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف المحادثة
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3 sm:p-4">
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
            disabled={
              loading ||
              loadingConversation
            }
            rows={4}
            placeholder="اكتب سؤالك، أو تابع سؤالًا سابقًا مثل: وما نتائج ذلك؟"
            className="academic-text w-full resize-y bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
            <p className="text-xs text-slate-600">
              المحادثة محفوظة تلقائيًا داخل المشروع — Ctrl + Enter للإرسال
            </p>

            <button
              type="button"
              onClick={
                askProject
              }
              disabled={
                loading ||
                loadingConversation ||
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
              ) : loadingConversation ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  جاري تحميل المحادثة
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
            <h3 className="font-bold text-white">
              المحادثة البحثية
            </h3>

            {conversation.map(
              (item, index) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/20"
                >
                  <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
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

                  <div className="p-4 sm:p-5">
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