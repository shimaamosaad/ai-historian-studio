"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  FileText,
  LoaderCircle,
  MessageSquarePlus,
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
  conversationId?: number;
  page?: number | null;
  pages?: number[];
  quote?: string | null;
  evidence?: EvidenceItem[];
  score?: number;
  confidence?: number;
  error?: string;
};

type StoredMessage = {
  id: number;
  role: string;
  content: string;
  confidence?: number | null;
  metadata?: string | null;
};

type ConversationResponse = {
  conversation?: {
    id: number;
    title?: string | null;
    messages:
      StoredMessage[];
  } | null;
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
        typeof item.text ===
          "string" &&
        item.text.trim().length >
          0
    )
    .map((item) => ({
      text:
        item.text
          .replace(/\s+/g, " ")
          .trim(),
      page:
        typeof item.page ===
        "number"
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

function normalizePages(
  value: unknown
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (
          item
        ): item is number =>
          typeof item ===
          "number"
      )
    )
  ).sort((a, b) => a - b);
}

function parseMetadata(
  metadata?: string | null
) {
  if (!metadata) {
    return {
      page: null as number | null,
      pages: [] as number[],
      quote: "",
      evidence: [] as EvidenceItem[],
      score: 0,
    };
  }

  try {
    const parsed =
      JSON.parse(metadata);

    const evidence =
      cleanEvidence(
        parsed?.evidence
      );

    const pages =
      normalizePages(
        parsed?.pages
      );

    return {
      page:
        typeof parsed?.page ===
        "number"
          ? parsed.page
          : pages[0] ?? null,
      pages,
      quote:
        typeof parsed?.quote ===
        "string"
          ? parsed.quote
          : "",
      evidence,
      score:
        typeof parsed?.score ===
        "number"
          ? parsed.score
          : 0,
    };
  } catch {
    return {
      page: null as number | null,
      pages: [] as number[],
      quote: "",
      evidence: [] as EvidenceItem[],
      score: 0,
    };
  }
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
      const meta =
        parseMetadata(
          message.metadata
        );

      items.push({
        id:
          `${pendingQuestion.id}-${message.id}`,
        question:
          pendingQuestion.content,
        answer:
          message.content,
        page:
          meta.page,
        pages:
          meta.pages,
        quote:
          meta.quote,
        evidence:
          meta.evidence,
        score:
          message.confidence ??
          meta.score,
      });

      pendingQuestion = null;
    }
  }

  return items;
}

function getPages(
  data: AskResponse,
  evidence: EvidenceItem[]
): number[] {
  const directPages =
    Array.isArray(data.pages)
      ? data.pages.filter(
          (
            value
          ): value is number =>
            typeof value ===
            "number"
        )
      : [];

  const evidencePages =
    evidence
      .map(
        (item) =>
          item.page
      )
      .filter(
        (
          page
        ): page is number =>
          typeof page ===
          "number"
      );

  const fallbackPage =
    typeof data.page ===
    "number"
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
  const [
    question,
    setQuestion,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loadingConversation,
    setLoadingConversation,
  ] = useState(true);

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

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      try {
        setLoadingConversation(
          true
        );

        const response =
          await fetch(
            `/api/documents/${documentId}/conversations`,
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
              "تعذر تحميل محادثة المستند."
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
          setConversation([]);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "تعذر تحميل محادثة المستند."
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
  }, [documentId]);

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

    try {
      const response =
        await fetch(
          `/api/documents/${documentId}/ask`,
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
            "حدث خطأ أثناء البحث داخل المستند"
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
          : "";

      const score =
        typeof data.confidence ===
        "number"
          ? data.confidence
          : typeof data.score ===
              "number"
            ? data.score
            : 0;

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
            page,
            pages,
            quote,
            evidence,
            score,
          },
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

  async function startNewConversation() {
    if (loading) {
      return;
    }

    try {
      setError("");

      const response =
        await fetch(
          `/api/documents/${documentId}/conversations`,
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
          `/api/documents/${documentId}/conversations?conversationId=${conversationId}`,
          {
            method:
              "DELETE",
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
      dir="rtl"
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-white">
            اسأل عن هذا المستند
          </h3>

          <p className="mt-1 text-xs leading-6 text-slate-500">
            المحادثة محفوظة تلقائيًا لهذا المستند، ويمكنك متابعة الأسئلة حتى بعد إعادة فتح الصفحة.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={
              startNewConversation
            }
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-50"
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
            className="inline-flex items-center gap-2 rounded-lg border border-red-400/15 bg-red-400/[0.05] px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            حذف المحادثة
          </button>
        </div>
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
          disabled={
            loading ||
            loadingConversation
          }
          className="w-full resize-y bg-transparent text-sm leading-7 text-white outline-none placeholder:text-slate-600"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <span className="text-[11px] text-slate-600">
            المحادثة محفوظة — Ctrl + Enter للإرسال
          </span>

          <button
            type="button"
            onClick={
              askDocument
            }
            disabled={
              loading ||
              loadingConversation ||
              !question.trim()
            }
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                جاري البحث
              </>
            ) : loadingConversation ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                جاري تحميل المحادثة
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

                  <p className="academic-text mt-3 whitespace-pre-wrap">
                    {
                      item.answer
                    }
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
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}