import {
  analyzeDocument,
  type AIAnalysisResult,
} from "@/lib/ai/analyzeDocument";

import type {
  HistoryAnalysisContext,
} from "./historyTypes";

/**
 * المحرك التاريخي الحالي.
 *
 * يستخدم analyzeDocument مؤقتًا حتى يتم ربط
 * مزود ذكاء اصطناعي حقيقي لاحقًا.
 */
export async function runHistoryAnalyzer(
  context: HistoryAnalysisContext
): Promise<AIAnalysisResult> {
  return analyzeDocument(
    context.normalizedText
  );
}