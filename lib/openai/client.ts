import OpenAI from "openai";

let openAIClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY غير موجود داخل ملف .env"
    );
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,
      timeout: 120_000,
      maxRetries: 2,
    });
  }

  return openAIClient;
}

export function getOpenAIModel(): string {
  return (
    process.env.OPENAI_ANALYSIS_MODEL?.trim() ||
    "gpt-5-mini"
  );
}