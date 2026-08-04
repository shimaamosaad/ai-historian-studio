import {
  getOpenAIClient,
  getOpenAIModel,
} from "@/lib/openai/client";

export type OpenAIReasoningEffort =
  | "low"
  | "medium"
  | "high";

export type OpenAIStructuredRequest<T> = {
  /*
   * اسم العملية، ويظهر في سجل Terminal فقط.
   * مثال:
   * document_analysis
   * section_analysis
   * document_question
   */
  operationName: string;

  /*
   * التعليمات العامة التي تحدد دور النموذج
   * والقواعد التي يجب أن يلتزم بها.
   */
  instructions: string;

  /*
   * المحتوى الفعلي المطلوب تحليله.
   */
  input: string;

  /*
   * اسم الـJSON Schema.
   * يجب أن يتكون من حروف وأرقام وشرطات
   * أو underscore فقط.
   */
  schemaName: string;

  /*
   * وصف مختصر للنتيجة المنظمة.
   */
  schemaDescription: string;

  /*
   * JSON Schema الذي يجب أن يلتزم به النموذج.
   */
  schema: Record<string, unknown>;

  /*
   * دالة تتحقق من JSON بعد إرجاعه من OpenAI
   * وتحوله إلى النوع المطلوب T.
   */
  validate: (value: unknown) => T;

  /*
   * الحد الأقصى لرموز الإخراج.
   */
  maxOutputTokens?: number;

  /*
   * مقدار التفكير المطلوب من النموذج.
   */
  reasoningEffort?: OpenAIReasoningEffort;
};

type OpenAIErrorLike = {
  status?: number;
  code?: string;
  type?: string;
  message?: string;
  name?: string;
};

function sanitizeSchemaName(
  value: string
): string {
  const cleanName = value
    .replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    )
    .slice(0, 64);

  return (
    cleanName ||
    "structured_response"
  );
}

function getFriendlyOpenAIError(
  error: unknown
): Error {
  const possibleError =
    error as OpenAIErrorLike;

  if (possibleError.status === 401) {
    return new Error(
      "مفتاح OpenAI غير صحيح أو غير مفعل."
    );
  }

  if (possibleError.status === 403) {
    return new Error(
      "لا يملك حساب OpenAI صلاحية استخدام النموذج المطلوب."
    );
  }

  if (
    possibleError.status === 429 ||
    possibleError.code ===
      "insufficient_quota"
  ) {
    return new Error(
      "تعذر تنفيذ التحليل بسبب حد الاستخدام أو عدم كفاية رصيد OpenAI."
    );
  }

  if (
    possibleError.status === 400
  ) {
    return new Error(
      possibleError.message ||
        "رفض OpenAI الطلب بسبب إعداد غير صالح."
    );
  }

  if (
    possibleError.status === 408 ||
    possibleError.code ===
      "timeout"
  ) {
    return new Error(
      "استغرق اتصال OpenAI وقتًا أطول من المتوقع. يُرجى المحاولة مرة أخرى."
    );
  }

  if (
    possibleError.status &&
    possibleError.status >= 500
  ) {
    return new Error(
      "خدمة OpenAI غير متاحة مؤقتًا. يُرجى المحاولة مرة أخرى."
    );
  }

  return new Error(
    possibleError.message ||
      "حدث خطأ أثناء الاتصال بخدمة OpenAI."
  );
}

function parseStructuredOutput(
  outputText: string
): unknown {
  try {
    return JSON.parse(outputText);
  } catch {
    throw new Error(
      "أعاد OpenAI نتيجة لا يمكن قراءتها بصيغة JSON."
    );
  }
}

/**
 * محرك موحد لجميع العمليات التي تحتاج
 * إلى نتيجة JSON منظمة من OpenAI.
 *
 * سيُستخدم لاحقًا في:
 * - تحليل المستند كاملًا.
 * - تحليل أجزاء المستند.
 * - أسئلة الباحث.
 * - المراجعة اللغوية.
 * - المقارنة بين المصادر.
 */
export async function runOpenAIStructured<T>({
  operationName,
  instructions,
  input,
  schemaName,
  schemaDescription,
  schema,
  validate,
  maxOutputTokens = 6000,
  reasoningEffort = "low",
}: OpenAIStructuredRequest<T>): Promise<T> {
  const cleanInput = input.trim();
  const cleanInstructions =
    instructions.trim();

  if (!cleanInput) {
    throw new Error(
      "لا يوجد محتوى صالح لإرساله إلى OpenAI."
    );
  }

  if (!cleanInstructions) {
    throw new Error(
      "تعليمات تحليل OpenAI غير موجودة."
    );
  }

  const client =
    getOpenAIClient();

  const model =
    getOpenAIModel();

  const startedAt = Date.now();

  console.log(
    `========== OPENAI ${operationName.toUpperCase()} ==========`
  );

  console.log(
    "Model:",
    model
  );

  console.log(
    "Input characters:",
    cleanInput.length
  );

  console.log(
    "Reasoning effort:",
    reasoningEffort
  );

  try {
    const response =
      await client.responses.create({
        model,

        store: false,

        max_output_tokens:
          maxOutputTokens,

        reasoning: {
          effort:
            reasoningEffort,
        },

        instructions:
          cleanInstructions,

        input:
          cleanInput,

        text: {
          format: {
            type:
              "json_schema",

            name:
              sanitizeSchemaName(
                schemaName
              ),

            description:
              schemaDescription,

            strict: true,

            schema,
          },
        },
      });

    const durationMs =
      Date.now() - startedAt;

    console.log(
      "Response status:",
      response.status
    );

    console.log(
      "Duration:",
      `${durationMs}ms`
    );

    console.log(
      "Usage:",
      response.usage
    );

    if (
      response.status ===
      "incomplete"
    ) {
      const reason =
        response
          .incomplete_details
          ?.reason;

      if (
        reason ===
        "max_output_tokens"
      ) {
        throw new Error(
          "لم يكتمل رد OpenAI لأن حد الإخراج لم يكن كافيًا."
        );
      }

      throw new Error(
        `لم يكتمل رد OpenAI. السبب: ${
          reason ??
          "غير معروف"
        }`
      );
    }

    if (
      response.status !==
      "completed"
    ) {
      throw new Error(
        `لم تكتمل عملية OpenAI بنجاح. الحالة: ${response.status}`
      );
    }

    const outputText =
      response.output_text?.trim();

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
        "وصل رد من OpenAI لكنه لم يحتوِ على نتيجة نصية."
      );
    }

    const parsed =
      parseStructuredOutput(
        outputText
      );

    const validated =
      validate(parsed);

    console.log(
      `========== OPENAI ${operationName.toUpperCase()} COMPLETED ==========`
    );

    return validated;
  } catch (error) {
    console.error(
      `OPENAI ${operationName.toUpperCase()} ERROR:`,
      error
    );

    throw getFriendlyOpenAIError(
      error
    );
  }
}