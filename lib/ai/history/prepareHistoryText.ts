import type {
  HistoryAnalysisContext,
  HistoryAnalysisOptions,
} from "./historyTypes";

const DEFAULT_MAX_TEXT_LENGTH = 120_000;

export function prepareHistoryText(
  text: string,
  options: HistoryAnalysisOptions = {}
): HistoryAnalysisContext {
  if (
    typeof text !== "string" ||
    text.trim().length === 0
  ) {
    throw new Error(
      "لا يوجد نص تاريخي صالح للتحليل"
    );
  }

  const maxTextLength =
    options.maxTextLength ??
    DEFAULT_MAX_TEXT_LENGTH;

  const normalizedText = text
    .replace(/\u0640/g, "")
    .replace(
      /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g,
      ""
    )
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxTextLength);

  if (normalizedText.length === 0) {
    throw new Error(
      "تعذر تجهيز النص التاريخي للتحليل"
    );
  }

  return {
    text,
    normalizedText,
    sourceLength: text.length,
  };
}