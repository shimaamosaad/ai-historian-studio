import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/lib/openai/client";

export type AIRelation = {
  source: string;
  relation: string;
  target: string;
};

export type AIAnalysisResult = {
  summary: string;
  people: string[];
  places: string[];
  events: string[];
  relations: AIRelation[];
};

/*
 * في أول اختبار لنرسل مستندًا ضخمًا بالكامل.
 * نبدأ بحجم آمن لتقليل التكلفة والتأكد من جودة التحليل.
 */
const MAX_ANALYSIS_CHARACTERS = 24_000;

const HISTORY_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    summary: {
      type: "string",
      description:
        "ملخص أكاديمي عربي أمين لمحتوى النص دون إضافة معلومات خارجية.",
    },

    people: {
      type: "array",
      description:
        "أسماء الشخصيات المذكورة صراحة في النص.",
      items: {
        type: "string",
      },
    },

    places: {
      type: "array",
      description:
        "أسماء الأماكن والدول والمدن والمناطق المذكورة صراحة في النص.",
      items: {
        type: "string",
      },
    },

    events: {
      type: "array",
      description:
        "الأحداث والوقائع والمعارك والتحولات التاريخية المذكورة صراحة في النص.",
      items: {
        type: "string",
      },
    },

    relations: {
      type: "array",
      description:
        "العلاقات الصريحة بين الشخصيات والأماكن والأحداث المذكورة في النص.",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          source: {
            type: "string",
            description:
              "اسم الكيان الأول كما ورد في النص.",
          },

          relation: {
            type: "string",
            description:
              "وصف عربي موجز ودقيق للعلاقة.",
          },

          target: {
            type: "string",
            description:
              "اسم الكيان الثاني كما ورد في النص.",
          },
        },

        required: [
          "source",
          "relation",
          "target",
        ],
      },
    },
  },

  required: [
    "summary",
    "people",
    "places",
    "events",
    "relations",
  ],
} as const;

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function prepareTextForAnalysis(
  text: string
): string {
  const normalized = normalizeText(text);

  if (
    normalized.length <=
    MAX_ANALYSIS_CHARACTERS
  ) {
    return normalized;
  }

  /*
   * الإصدار الأول يحلل بداية المستند فقط عند تجاوز
   * الحجم المحدد. بعد نجاح الاختبار سنضيف تقسيم
   * المستندات الكبيرة إلى أجزاء ودمج نتائجها.
   */
  return normalized
    .slice(0, MAX_ANALYSIS_CHARACTERS)
    .trim();
}

function uniqueStrings(
  values: unknown
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === "string"
        )
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function validateRelations(
  value: unknown
): AIRelation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const relations: AIRelation[] = [];

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const relation =
      item as Partial<AIRelation>;

    const source =
      typeof relation.source === "string"
        ? relation.source.trim()
        : "";

    const relationName =
      typeof relation.relation === "string"
        ? relation.relation.trim()
        : "";

    const target =
      typeof relation.target === "string"
        ? relation.target.trim()
        : "";

    if (
      !source ||
      !relationName ||
      !target
    ) {
      continue;
    }

    relations.push({
      source,
      relation: relationName,
      target,
    });
  }

  const seen = new Set<string>();

  return relations.filter((relation) => {
    const key = [
      relation.source,
      relation.relation,
      relation.target,
    ]
      .join("|")
      .toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function validateResult(
  value: unknown
): AIAnalysisResult {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "أعاد OpenAI نتيجة غير صالحة للتحليل."
    );
  }

  const result =
    value as Partial<AIAnalysisResult>;

  const summary =
    typeof result.summary === "string"
      ? result.summary.trim()
      : "";

  if (!summary) {
    throw new Error(
      "لم يتمكن OpenAI من إنشاء ملخص صالح للمستند."
    );
  }

  return {
    summary,
    people: uniqueStrings(
      result.people
    ),
    places: uniqueStrings(
      result.places
    ),
    events: uniqueStrings(
      result.events
    ),
    relations: validateRelations(
      result.relations
    ),
  };
}

function getFriendlyOpenAIError(
  error: unknown
): Error {
  const possibleError = error as {
    status?: number;
    code?: string;
    message?: string;
  };

  if (possibleError.status === 401) {
    return new Error(
      "مفتاح OpenAI غير صحيح أو غير مفعل. راجعي OPENAI_API_KEY داخل ملف .env."
    );
  }

  if (possibleError.status === 429) {
    return new Error(
      "تعذر تنفيذ التحليل بسبب حد الاستخدام أو الرصيد في OpenAI. راجعي صفحة Billing."
    );
  }

  if (
    possibleError.code ===
    "insufficient_quota"
  ) {
    return new Error(
      "رصيد OpenAI غير كافٍ لتنفيذ التحليل."
    );
  }

  return new Error(
    possibleError.message ||
      "حدث خطأ أثناء الاتصال بخدمة OpenAI."
  );
}

export async function analyzeDocument(
  text: string
): Promise<AIAnalysisResult> {
  if (!text || text.trim().length === 0) {
    throw new Error(
      "لا يوجد نص صالح للتحليل."
    );
  }

  const analysisText =
    prepareTextForAnalysis(text);

  if (analysisText.length < 20) {
    throw new Error(
      "النص المستخرج قصير جدًا ولا يكفي لإجراء تحليل موثوق."
    );
  }

  const client = getOpenAIClient();
  const model = getOpenAIModel();

  console.log(
    "========== OPENAI HISTORY ANALYSIS =========="
  );
  console.log("Model:", model);
  console.log(
    "Input characters:",
    analysisText.length
  );

  try {
    const response =
      await client.responses.create({
        model,

        /*
         * لا نحفظ محتوى المستند لدى Responses API
         * كحالة قابلة للاسترجاع.
         */
        store: false,

        max_output_tokens: 8_000,

reasoning: {
  effort: "low",
},

instructions: `
أنت محلل أكاديمي متخصص في الوثائق والمصادر التاريخية العربية.

التزم بالقواعد التالية التزامًا صارمًا:

1. اعتمد فقط على النص المرسل إليك.
2. لا تضف معلومات من معرفتك العامة.
3. لا تخترع أسماء أو تواريخ أو علاقات غير مذكورة.
4. إذا لم توجد عناصر من نوع معين فأعد مصفوفة فارغة.
5. اكتب الملخص باللغة العربية الفصحى الواضحة.
6. اجعل الملخص أمينًا للنص ومناسبًا للباحث الأكاديمي.
7. استخرج أسماء الشخصيات كما وردت في النص، مع إزالة الألقاب العامة فقط عندما لا تكون جزءًا من الاسم.
8. استخرج الأماكن والمدن والدول والمناطق الجغرافية المذكورة صراحة.
9. استخرج الأحداث والمعارك والوقائع التاريخية المذكورة صراحة.
10. لا تُنشئ علاقة إلا إذا كانت مدعومة بعبارة واضحة في النص.
11. يجب أن يكون source وtarget اسمَي كيانين مذكورين في النص.
12. اجعل وصف relation موجزًا ودقيقًا بالعربية.
13. تجاهل قوائم المراجع والفهارس وأرقام الصفحات إذا لم تحمل مضمونًا تاريخيًا.
14. إذا بدا جزء من النص مشوهًا، فلا تستنتج منه معلومات غير مؤكدة.
        `.trim(),

        input: `
حلل النص التاريخي التالي وأعد النتيجة وفق البنية المطلوبة فقط:

----- بداية النص -----

${analysisText}

----- نهاية النص -----
        `.trim(),

        text: {
          format: {
            type: "json_schema",
            name: "history_analysis",
            description:
              "تحليل منظم لوثيقة تاريخية عربية.",
            strict: true,
            schema:
              HISTORY_ANALYSIS_SCHEMA,
          },
        },
      });

    console.log(
  "OpenAI response status:",
  response.status
);

console.log(
  "OpenAI incomplete details:",
  response.incomplete_details
);

console.log(
  "OpenAI usage:",
  response.usage
);

const outputText =
  response.output_text?.trim();

if (
  response.status === "incomplete"
) {
  const reason =
    response.incomplete_details?.reason;

  throw new Error(
    reason === "max_output_tokens"
      ? "توقف التحليل لأن حد إخراج OpenAI لم يكن كافيًا."
      : `لم يكتمل رد OpenAI. السبب: ${
          reason ?? "غير معروف"
        }`
  );
}

if (!outputText) {
  console.error(
    "OpenAI raw output:",
    JSON.stringify(
      response.output,
      null,
      2
    )
  );

  throw new Error(
    "وصل رد من OpenAI لكنه لم يحتوِ على نتيجة تحليل نصية."
  );
}

    const parsed: unknown =
      JSON.parse(outputText);

    const result =
      validateResult(parsed);

    console.log(
      "OpenAI request ID:",
      response._request_id
    );
    console.log(
      "People:",
      result.people.length
    );
    console.log(
      "Places:",
      result.places.length
    );
    console.log(
      "Events:",
      result.events.length
    );
    console.log(
      "Relations:",
      result.relations.length
    );
    console.log(
      "============================================="
    );

    return result;
  } catch (error) {
    console.error(
      "OPENAI HISTORY ANALYSIS ERROR:",
      error
    );

    throw getFriendlyOpenAIError(
      error
    );
  }
}