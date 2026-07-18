import { DocumentSearchResult } from "./searchDocument";

export type GeneratedAnswer = {
  answer: string;
  quote: string;
  page: number | null;
  confidence: number;
};

function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/(?<=[\.!\؟\n])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function uniqueSentences(sentences: string[]) {
  const seen = new Set<string>();

  return sentences.filter((sentence) => {
    const key = sentence.replace(/\s+/g, " ").trim();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function generateAnswer(
  question: string,
  results: DocumentSearchResult[]
): GeneratedAnswer {
  if (results.length === 0) {
    return {
      answer: "لم يتم العثور على إجابة داخل المستند.",
      quote: "",
      page: null,
      confidence: 0,
    };
  }

  const best = results[0];

  const allSentences = uniqueSentences(
    results
      .slice(0, 3)
      .flatMap((r) => splitSentences(r.text))
  );

  const summary = allSentences
    .slice(0, 4)
    .join(" ");

  const confidence = Math.min(
    100,
    Math.round(best.score * 5)
  );

  return {
    answer:
      summary ||
      "تم العثور على مقطع مرتبط بالسؤال.",
    quote: best.text,
    page: best.page,
    confidence,
  };
}