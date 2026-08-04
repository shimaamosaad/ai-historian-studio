import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/lib/openai/client";

import type {
  DocumentQuestionMode,
  DocumentSearchResult,
} from "@/lib/ai/searchDocument";

export type DocumentAnswerEvidence = {
  text: string;
  page: number | null;
};

export type GeneratedDocumentAnswer = {
  answer: string;
  quote: string;
  page: number | null;
  pages: number[];
  evidence: DocumentAnswerEvidence[];
  confidence: number;
  evidenceCount: number;
  mode: DocumentQuestionMode;
};

type ModelAnswer = {
  answer: string;
  evidenceIndexes: number[];
  confidence: number;
};

const DOCUMENT_ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    answer: {
      type: "string",
      description:
        "إجابة عربية أكاديمية واضحة، تفصل بين ما ورد في الوثيقة والإثراء السياقي من معرفة النموذج.",
    },

    evidenceIndexes: {
      type: "array",
      description:
        "أرقام المقاطع الداعمة للإجابة، اعتمادًا على الأرقام المعروضة داخل الأدلة.",
      items: {
        type: "integer",
        minimum: 1,
      },
    },

    confidence: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description:
        "درجة الثقة في مدى دعم الوثيقة للإجابة.",
    },
  },

  required: [
    "answer",
    "evidenceIndexes",
    "confidence",
  ],
} as const;

function cleanText(
  value: string,
  maxLength: number
): string {
  const clean = value
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  const shortened = clean.slice(
    0,
    maxLength
  );

  const finalSeparator = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf("،"),
    shortened.lastIndexOf("؛"),
    shortened.lastIndexOf("؟"),
    shortened.lastIndexOf(" ")
  );

  if (finalSeparator >= maxLength * 0.7) {
    return `${shortened
      .slice(0, finalSeparator + 1)
      .trim()}...`;
  }

  return `${shortened.trim()}...`;
}

function buildEvidenceText(
  results: DocumentSearchResult[]
): string {
  return results
    .map((result, index) => {
      const pageLabel =
        result.page !== null
          ? `الصفحة ${result.page}`
          : "صفحة غير محددة";

      return [
        `[[EVIDENCE:${index + 1}]]`,
        `المصدر: ${pageLabel}`,
        cleanText(result.text, 2200),
      ].join("\n");
    })
    .join("\n\n");
}

function uniqueNumbers(
  values: unknown,
  maximum: number
): number[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values.filter(
        (value): value is number =>
          Number.isInteger(value) &&
          value >= 1 &&
          value <= maximum
      )
    )
  );
}

function validateModelAnswer(
  value: unknown,
  evidenceCount: number
): ModelAnswer {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "أعاد OpenAI نتيجة غير صالحة لسؤال المستند."
    );
  }

  const result =
    value as Partial<ModelAnswer>;

  const answer =
    typeof result.answer === "string"
      ? result.answer.trim()
      : "";

  if (!answer) {
    throw new Error(
      "لم يتمكن OpenAI من إنشاء إجابة صالحة."
    );
  }

  const confidence =
    typeof result.confidence === "number"
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(result.confidence)
          )
        )
      : 0;

  return {
    answer,

    evidenceIndexes: uniqueNumbers(
      result.evidenceIndexes,
      evidenceCount
    ),

    confidence,
  };
}

function removeDuplicateEvidence(
  results: DocumentSearchResult[]
): DocumentSearchResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = result.text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500)
      .toLowerCase();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildEvidenceList(
  results: DocumentSearchResult[]
): DocumentAnswerEvidence[] {
  return removeDuplicateEvidence(results)
    .slice(0, 8)
    .map((result) => ({
      text: cleanText(
        result.text,
        900
      ),
      page: result.page,
    }));
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
      "مفتاح OpenAI غير صحيح أو غير مفعل."
    );
  }

  if (
    possibleError.status === 429 ||
    possibleError.code ===
      "insufficient_quota"
  ) {
    return new Error(
      "تعذر إنشاء الإجابة بسبب حد الاستخدام أو الرصيد في OpenAI."
    );
  }

  return new Error(
    possibleError.message ||
      "حدث خطأ أثناء إنشاء إجابة المستند."
  );
}

export async function generateDocumentAnswer(
  question: string,
  results: DocumentSearchResult[],
  mode: DocumentQuestionMode
): Promise<GeneratedDocumentAnswer> {
  if (!question.trim()) {
    throw new Error(
      "لا يوجد سؤال صالح للإجابة."
    );
  }

  if (results.length === 0) {
    return {
      answer:
        "لم يتم العثور على معلومات واضحة مرتبطة بالسؤال داخل المستند.",

      quote: "",

      page: null,

      pages: [],

      evidence: [],

      confidence: 0,

      evidenceCount: 0,

      mode,
    };
  }

  /*
   * نرسل أفضل المقاطع فقط إلى OpenAI.
   * هذا يقلل التكلفة ويرفع جودة الإجابة.
   */
  const selectedResults =
    removeDuplicateEvidence(
      results
    ).slice(0, 12);

  const evidenceText =
    buildEvidenceText(
      selectedResults
    );

  const client = getOpenAIClient();
  const model = getOpenAIModel();

  try {
    const response =
      await client.responses.create({
        model,

        store: false,

        max_output_tokens: 6000,

        reasoning: {
          effort: "low",
        },

        instructions: `
أنت مساعد بحث أكاديمي متخصص في تحليل الوثائق التاريخية العربية.

مهمتك الإجابة عن سؤال الباحث بالاعتماد أولًا على الأدلة المرفقة من الوثيقة.

قواعد إلزامية:

1. اقرأ السؤال وجميع الأدلة قبل الإجابة.
2. اعتمد في قسم "الإجابة من الوثيقة" فقط على الأدلة المرفقة.
3. لا تنسب إلى الوثيقة معلومة غير موجودة في الأدلة.
4. اجمع المعلومات المتفرقة من أكثر من صفحة عندما تكون مرتبطة بالسؤال.
5. لا تكرر النصوص حرفيًا إلا عند الحاجة إلى اقتباس قصير.
6. اكتب بالعربية الفصحى الواضحة وبأسلوب أكاديمي.
7. إذا كانت الأدلة غير كافية، صرّح بذلك بوضوح.
8. يمكنك إضافة معرفة تاريخية عامة في قسم مستقل عنوانه:
   "إثراء سياقي من الذكاء الاصطناعي".
9. يجب أن توضّح أن الإثراء السياقي ليس مقتبسًا من الوثيقة.
10. لا تخلط بين معلومات الوثيقة ومعرفة النموذج.
11. لا تخترع مصدرًا أو رقم صفحة.
12. اختر evidenceIndexes فقط من أرقام الأدلة التي دعمت الإجابة فعلًا.
13. اجعل الإجابة منظمة بحسب الحاجة، مثل:
   - الإجابة من الوثيقة
   - أهم الأدلة
   - التحليل والاستنتاج
   - إثراء سياقي من الذكاء الاصطناعي
14. إذا كان السؤال يطلب استخراجًا، اعرض العناصر بوضوح.
15. إذا كان السؤال يطلب تحليلًا أو مناقشة، اربط بين الأسباب والنتائج والسياقات.
16. إذا كان النص المستخرج به أخطاء لغوية أو تشوهات بسيطة، افهم المعنى قدر الإمكان، لكن لا تخترع معلومات غير مؤكدة.
17. عند تحليل العلاقة بين الشخصيات والأحداث، اربط كل شخصية بالأحداث التي شاركت فيها أو أثرت فيها بحسب الأدلة المتاحة.
        `.trim(),

        input: `
سؤال الباحث:

${question}

نوع الطلب:
${mode}

الأدلة المستخرجة من الوثيقة:

${evidenceText}
        `.trim(),

        text: {
          format: {
            type: "json_schema",
            name: "document_answer",
            description:
              "إجابة بحثية منظمة مع تحديد الأدلة المستخدمة.",
            strict: true,
            schema:
              DOCUMENT_ANSWER_SCHEMA,
          },
        },
      });

    console.log(
      "Document answer status:",
      response.status
    );

    console.log(
      "Document answer usage:",
      response.usage
    );

    if (
      response.status === "incomplete"
    ) {
      const reason =
        response.incomplete_details?.reason;

      throw new Error(
        reason === "max_output_tokens"
          ? "لم يكتمل رد OpenAI بسبب حد الإخراج."
          : `لم يكتمل رد OpenAI. السبب: ${
              reason ?? "غير معروف"
            }`
      );
    }

    const outputText =
      response.output_text?.trim();

    if (!outputText) {
      console.error(
        "Document answer raw output:",
        JSON.stringify(
          response.output,
          null,
          2
        )
      );

      throw new Error(
        "وصل رد من OpenAI دون إجابة نصية."
      );
    }

    const parsed: unknown =
      JSON.parse(outputText);

    const modelAnswer =
      validateModelAnswer(
        parsed,
        selectedResults.length
      );

    const selectedEvidence =
      modelAnswer.evidenceIndexes
        .map(
          (index) =>
            selectedResults[index - 1]
        )
        .filter(
          (
            result
          ): result is DocumentSearchResult =>
            Boolean(result)
        );

    /*
     * إذا لم يختر النموذج أدلة،
     * نستخدم أفضل 3 نتائج من البحث.
     */
    const finalEvidence =
      selectedEvidence.length > 0
        ? removeDuplicateEvidence(
            selectedEvidence
          )
        : selectedResults.slice(0, 3);

    const pages = Array.from(
      new Set(
        finalEvidence
          .map(
            (result) =>
              result.page
          )
          .filter(
            (
              page
            ): page is number =>
              typeof page === "number"
          )
      )
    ).sort(
      (a, b) => a - b
    );

    const firstEvidence =
      finalEvidence[0];

    const evidence =
      buildEvidenceList(
        finalEvidence
      );

    return {
      answer:
        modelAnswer.answer,

      /*
       * نحتفظ بالاقتباس الأول مؤقتًا
       * حتى يظل متوافقًا مع الواجهة الحالية.
       */
      quote: firstEvidence
        ? cleanText(
            firstEvidence.text,
            1200
          )
        : "",

      page:
        firstEvidence?.page ??
        null,

      pages,

      evidence,

      confidence:
        modelAnswer.confidence,

      evidenceCount:
        evidence.length,

      mode,
    };
  } catch (error) {
    console.error(
      "GENERATE DOCUMENT ANSWER ERROR:",
      error
    );

    throw getFriendlyOpenAIError(
      error
    );
  }
}