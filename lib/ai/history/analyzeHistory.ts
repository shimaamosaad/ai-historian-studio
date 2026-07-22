import type {
  AIAnalysisResult,
} from "@/lib/ai/analyzeDocument";

import {
  prepareHistoryText,
} from "./prepareHistoryText";

import {
  runHistoryAnalyzer,
} from "./runHistoryAnalyzer";

import type {
  HistoryAnalysisOptions,
} from "./historyTypes";

export async function analyzeHistory(
  text: string,
  options: HistoryAnalysisOptions = {}
): Promise<AIAnalysisResult> {
  const context = prepareHistoryText(
    text,
    options
  );

  const result = await runHistoryAnalyzer(
    context
  );

  return validateHistoryResult(result);
}

function validateHistoryResult(
  result: AIAnalysisResult
): AIAnalysisResult {
  return {
    summary:
      typeof result.summary === "string"
        ? result.summary.trim()
        : "",

    people: Array.isArray(result.people)
      ? uniqueStrings(result.people)
      : [],

    places: Array.isArray(result.places)
      ? uniqueStrings(result.places)
      : [],

    events: Array.isArray(result.events)
      ? uniqueStrings(result.events)
      : [],

    relations: Array.isArray(
      result.relations
    )
      ? result.relations.filter(
          (relation) =>
            Boolean(relation.source) &&
            Boolean(relation.relation) &&
            Boolean(relation.target)
        )
      : [],
  };
}

function uniqueStrings(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}