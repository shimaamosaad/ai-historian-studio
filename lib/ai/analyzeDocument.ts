export type AIRelation = {
  source: string;
  relation: string;
  target: string;
};

export type AIAnalysisResult = {
  summary: string;
  people: string[];
  places: string[];
  events: string[];
  relations: AIRelation[];
};

export async function analyzeDocument(
  text: string
): Promise<AIAnalysisResult> {
  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for analysis");
  }

  console.log("========== MOCK AI ==========");

  const normalized = text.replace(/\s+/g, " ").trim();

  const people: string[] = [];
  const places: string[] = [];
  const events: string[] = [];
  const relations: AIRelation[] = [];

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

  if (normalized.includes("حطين")) {
    places.push("حطين");
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

  // -------- Relations (Mock) --------

  if (
    normalized.includes("صلاح الدين") &&
    normalized.includes("معركة")
  ) {
    relations.push({
      source: "صلاح الدين الأيوبي",
      relation: "قاد",
      target: "معركة تاريخية",
    });
  }

  if (
    normalized.includes("معركة") &&
    normalized.includes("حطين")
  ) {
    relations.push({
      source: "معركة تاريخية",
      relation: "وقعت في",
      target: "حطين",
    });
  }

  if (
    normalized.includes("صلاح الدين") &&
    normalized.includes("القدس")
  ) {
    relations.push({
      source: "صلاح الدين الأيوبي",
      relation: "حرر",
      target: "القدس",
    });
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
    relations: relations.filter(
      (relation, index, self) =>
        index ===
        self.findIndex(
          (r) =>
            r.source === relation.source &&
            r.relation === relation.relation &&
            r.target === relation.target
        )
    ),
  };

  console.log(result);

  return result;
}