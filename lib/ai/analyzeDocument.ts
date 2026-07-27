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

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function createSummary(text: string, maxLength = 700): string {
  const cleanText = normalizeText(text).replace(/\s+/g, " ");

  if (!cleanText) {
    return "";
  }

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  const shortened = cleanText.slice(0, maxLength);

  const lastSentenceEnd = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf("؟"),
    shortened.lastIndexOf("!"),
    shortened.lastIndexOf("؛")
  );

  if (lastSentenceEnd >= 200) {
    return `${shortened.slice(0, lastSentenceEnd + 1).trim()}...`;
  }

  return `${shortened.trim()}...`;
}

function includesArabicPhrase(text: string, phrase: string): boolean {
  const normalizedText = text
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

  const normalizedPhrase = phrase
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedText.includes(normalizedPhrase);
}

function extractExactMentions(
  text: string,
  candidates: string[]
): string[] {
  return candidates.filter((candidate) =>
    includesArabicPhrase(text, candidate)
  );
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

export async function analyzeDocument(
  text: string
): Promise<AIAnalysisResult> {
  if (!text || text.trim().length === 0) {
    throw new Error("No text provided for analysis");
  }

  console.log("========== SAFE MOCK AI ==========");

  const normalized = normalizeText(text);

  /*
   * هذه القوائم مؤقتة فقط.
   * لن يتم حفظ أي عنصر إلا إذا كان اسمه موجودًا بالفعل داخل النص.
   */

  const peopleCandidates = [
    "صلاح الدين الأيوبي",
    "محمد علي باشا",
    "نابليون بونابرت",
    "جوهر الصقلي",
    "المعز لدين الله الفاطمي",
    "الحاكم بأمر الله",
    "المستنصر بالله الفاطمي",
    "عمرو بن العاص",
    "أحمد بن طولون",
    "الظاهر بيبرس",
    "الناصر محمد بن قلاوون",
  ];

  const placeCandidates = [
    "مصر",
    "القاهرة",
    "الإسكندرية",
    "الفسطاط",
    "الكوفة",
    "دمشق",
    "بغداد",
    "الحجاز",
    "مكة",
    "المدينة المنورة",
    "الشام",
    "العراق",
    "اليمن",
    "المغرب",
    "الأندلس",
    "القدس",
  ];

  const eventCandidates = [
    "الفتح الإسلامي",
    "الفتح العربي لمصر",
    "الدولة الفاطمية",
    "العصر الفاطمي",
    "الدولة الأيوبية",
    "العصر الأيوبي",
    "الدولة المملوكية",
    "العصر المملوكي",
    "الحملة الفرنسية",
    "ثورة القاهرة",
    "معركة حطين",
    "الحروب الصليبية",
  ];

  const people = uniqueValues(
    extractExactMentions(normalized, peopleCandidates)
  );

  const places = uniqueValues(
    extractExactMentions(normalized, placeCandidates)
  );

  const events = uniqueValues(
    extractExactMentions(normalized, eventCandidates)
  );

  /*
   * لا ننشئ علاقات تجريبية.
   * العلاقات ستظل فارغة حتى تشغيل OpenAI الحقيقي،
   * حتى لا تضاف علاقات غير موجودة في المستند.
   */
  const relations: AIRelation[] = [];

  const result: AIAnalysisResult = {
    summary: createSummary(normalized),
    people,
    places,
    events,
    relations,
  };

  console.log(result);
  console.log("==================================");

  return result;
}