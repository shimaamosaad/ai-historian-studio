export function normalizeArabicText(text: string): string {
  if (!text) return "";

  return text
    .normalize("NFKC")

    // إزالة التشكيل
    .replace(/[\u064B-\u065F\u0670]/g, "")

    // إزالة التطويل
    .replace(/\u0640/g, "")

    // إزالة العلامات الخفية
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")

    // توحيد الألف
    .replace(/[أإآٱ]/g, "ا")

    // توحيد الياء
    .replace(/ى/g, "ي")

    // توحيد الهمزات
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")

    // إزالة المسافات الزائدة
    .replace(/\s+/g, " ")

    .trim();
}