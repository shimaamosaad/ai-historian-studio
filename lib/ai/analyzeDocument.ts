export type AIRelation = { source: string; relation: string; target: string };
export type AIAnalysisResult = { summary: string; people: string[]; places: string[]; events: string[]; relations: AIRelation[] };

function normalizeArabic(text: string) {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function analyzeDocument(text: string): Promise<AIAnalysisResult> {
  if (!text.trim()) throw new Error("No text provided for analysis");
  const normalized = normalizeArabic(text);
  const people: string[] = [];
  const places: string[] = [];
  const events: string[] = [];
  const relations: AIRelation[] = [];

  if (normalized.includes("صلاح الدين")) people.push("صلاح الدين الأيوبي");
  if (normalized.includes("كليوباترا")) people.push("كليوباترا");
  if (normalized.includes("رمسيس")) people.push("رمسيس الثاني");
  if (normalized.includes("محمد علي")) people.push("محمد علي باشا");
  if (normalized.includes("مصر")) places.push("مصر");
  if (normalized.includes("الاسكندريه")) places.push("الإسكندرية");
  if (normalized.includes("القاهره")) places.push("القاهرة");
  if (normalized.includes("القدس")) places.push("القدس");
  if (normalized.includes("حطين")) places.push("حطين");
  if (normalized.includes("الصليبي")) events.push("الحروب الصليبية");
  if (normalized.includes("معركه")) events.push("معركة تاريخية");
  if (normalized.includes("فتح")) events.push("فتح تاريخي");
  if (normalized.includes("ثوره")) events.push("ثورة تاريخية");

  if (people.includes("صلاح الدين الأيوبي") && events.includes("معركة تاريخية")) relations.push({ source: "صلاح الدين الأيوبي", relation: "قاد", target: "معركة تاريخية" });
  if (events.includes("معركة تاريخية") && places.includes("حطين")) relations.push({ source: "معركة تاريخية", relation: "وقعت في", target: "حطين" });
  if (people.includes("صلاح الدين الأيوبي") && places.includes("القدس")) relations.push({ source: "صلاح الدين الأيوبي", relation: "حرر", target: "القدس" });

  return {
    summary: text.replace(/\s+/g, " ").trim().slice(0, 250) + (text.length > 250 ? "..." : ""),
    people: [...new Set(people)], places: [...new Set(places)], events: [...new Set(events)], relations,
  };
}
