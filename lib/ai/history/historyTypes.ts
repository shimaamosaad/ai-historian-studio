import type {
  AIAnalysisResult,
  AIRelation,
} from "@/lib/ai/analyzeDocument";

export type HistoryAnalysisResult =
  AIAnalysisResult;

export type HistoryRelation =
  AIRelation;

export type HistoryAnalysisContext = {
  text: string;
  normalizedText: string;
  sourceLength: number;
};

export type HistoryAnalysisOptions = {
  maxTextLength?: number;
};