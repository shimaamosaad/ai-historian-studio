import { runOpenAIStructured } from "@/lib/ai/core/openai";

export type AcademicChange = {
  original: string;
  corrected: string;
  reason: string;
  category: "SPELLING" | "GRAMMAR" | "PUNCTUATION" | "STYLE";
};

export type AcademicReviewResult = {
  reviewedText: string;
  changes: AcademicChange[];
};

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    reviewedText: { type: "string" },
    changes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          original: { type: "string" },
          corrected: { type: "string" },
          reason: { type: "string" },
          category: {
            type: "string",
            enum: ["SPELLING", "GRAMMAR", "PUNCTUATION", "STYLE"],
          },
        },
        required: ["original", "corrected", "reason", "category"],
      },
    },
  },
  required: ["reviewedText", "changes"],
} as const;

function validateResult(value: unknown): AcademicReviewResult {
  if (!value || typeof value !== "object") {
    throw new Error("نتيجة المراجعة اللغوية غير صالحة.");
  }

  const result = value as Partial<AcademicReviewResult>;

  if (typeof result.reviewedText !== "string" || !Array.isArray(result.changes)) {
    throw new Error("نتيجة المراجعة اللغوية غير مكتملة.");
  }

  return {
    reviewedText: result.reviewedText.trim(),
    changes: result.changes.filter((change): change is AcademicChange =>
      Boolean(
        change &&
          typeof change.original === "string" &&
          typeof change.corrected === "string" &&
          typeof change.reason === "string" &&
          ["SPELLING", "GRAMMAR", "PUNCTUATION", "STYLE"].includes(change.category)
      )
    ),
  };
}

export async function reviewAcademicSection({
  text,
  reviewLevel,
}: {
  text: string;
  reviewLevel: string;
}): Promise<AcademicReviewResult> {
  const levelInstruction =
    reviewLevel === "LANGUAGE"
      ? "صحح الأخطاء الإملائية والنحوية وعلامات الترقيم فقط."
      : "صحح اللغة وحسّن الصياغة الأكاديمية والوضوح دون تغيير المعنى.";

  return runOpenAIStructured<AcademicReviewResult>({
    operationName: "academic_language_review",
    instructions: `أنت مراجع لغوي أكاديمي متخصص في الرسائل العلمية العربية. ${levelInstruction}
حافظ على المعنى والحجج وترتيب الفقرات. لا تغيّر الآيات القرآنية أو الأحاديث أو الاقتباسات المباشرة أو نصوص المراجع أو الأسماء أو الأرقام أو التواريخ. إذا شككت في نص محمي فاتركه كما هو. لا تضف معلومات جديدة ولا تحذف استشهادات. أعد النص كاملًا بعد المراجعة، وسجل التغييرات الفعلية فقط باختصار.`,
    input: text,
    schemaName: "academic_language_review",
    schemaDescription: "نص أكاديمي عربي بعد المراجعة مع قائمة التغييرات.",
    schema: REVIEW_SCHEMA,
    validate: validateResult,
    maxOutputTokens: 8000,
    reasoningEffort: "low",
  });
}
