export type AIAnalysisResult = {
  summary: string;
  people: string[];
  places: string[];
  events: string[];
};

export async function analyzeDocument(
  text: string
): Promise<AIAnalysisResult> {
  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for analysis");
  }

  console.log("========== MOCK AI ==========");

  const normalized = text
    .replace(/\s+/g, " ")
    .trim();

  const people: string[] = [];
  const places: string[] = [];
  const events: string[] = [];

  // -------- People --------

  if (normalized.includes("صلاح الدين")) {
    people.push("صلاح الدين الأيوبي");
  }

  if (normalized.includes("كليوباترا")) {
    people.push("كليوباترا");
  }

  if (normalized.includes("رمسيس")) {
    people.push("رمسيس الثاني");
  }

  if (normalized.includes("محمد علي")) {
    people.push("محمد علي باشا");
  }

  // -------- Places --------

  if (normalized.includes("مصر")) {
    places.push("مصر");
  }

  if (normalized.includes("الإسكندرية")) {
    places.push("الإسكندرية");
  }

  if (normalized.includes("القاهرة")) {
    places.push("القاهرة");
  }

  if (normalized.includes("القدس")) {
    places.push("القدس");
  }

  // -------- Events --------

  if (normalized.includes("الصليبي")) {
    events.push("الحروب الصليبية");
  }

  if (normalized.includes("معركة")) {
    events.push("معركة تاريخية");
  }

  if (normalized.includes("فتح")) {
    events.push("فتح تاريخي");
  }

  if (normalized.includes("ثورة")) {
    events.push("ثورة تاريخية");
  }

  const summary =
    normalized.length > 250
      ? normalized.substring(0, 250) + "..."
      : normalized;

  const result: AIAnalysisResult = {
    summary,
    people: [...new Set(people)],
    places: [...new Set(places)],
    events: [...new Set(events)],
  };

  console.log(result);

  return result;
}