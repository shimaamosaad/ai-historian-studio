import type {
  AIAnalysisResult,
} from "@/lib/ai/analyzeDocument";

import {
  analyzeHistory,
} from "@/lib/ai/history/analyzeHistory";

import type {
  ResearchDomainId,
} from "@/lib/domains/domainConfig";

/**
 * يختار محلل الوثائق المناسب بناءً
 * على تخصص المشروع.
 */
export async function analyzeByDomain(
  text: string,
  domainId: ResearchDomainId = "history"
): Promise<AIAnalysisResult> {
  if (!text || text.trim().length === 0) {
    throw new Error(
      "لا يوجد نص صالح للتحليل"
    );
  }

  switch (domainId) {
    case "history":
      return analyzeHistory(text);

    case "archaeology":
    case "literature":
    case "islamic-studies":
    case "law":
    case "sociology":
    case "psychology":
    case "geography":
    case "political-science":
    case "economics":
      throw new Error(
        "محلل هذا التخصص غير متاح حاليًا"
      );

    default: {
      const unsupportedDomain: never =
        domainId;

      throw new Error(
        `تخصص غير معروف: ${unsupportedDomain}`
      );
    }
  }
}