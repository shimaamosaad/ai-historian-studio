import {
  BookOpen,
  Brain,
  Building2,
  Gavel,
  Globe2,
  Landmark,
  Scale,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * التخصصات التي يمكن لمنصة أثر دعمها.
 *
 * التاريخ هو التخصص المفعّل في النسخة الحالية.
 * بقية التخصصات محفوظة للتوسع المستقبلي.
 */
export type ResearchDomainId =
  | "history"
  | "archaeology"
  | "literature"
  | "islamic-studies"
  | "law"
  | "sociology"
  | "psychology"
  | "geography"
  | "political-science"
  | "economics";

export type DomainEntityType = {
  id: string;
  label: string;
  pluralLabel: string;
};

export type DomainAnalysisSection = {
  id: string;
  title: string;
  description: string;
};

export type ResearchDomain = {
  id: ResearchDomainId;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;

  /**
   * هل يستطيع المستخدم إنشاء مشروع بهذا التخصص الآن؟
   */
  enabled: boolean;

  /**
   * أنواع الكيانات التي يستخدمها التخصص.
   */
  entityTypes: DomainEntityType[];

  /**
   * أقسام التقرير والتحليل المناسبة للتخصص.
   */
  analysisSections: DomainAnalysisSection[];

  /**
   * كلمات تساعد محرك البحث والتحليل مستقبلًا.
   */
  keywords: string[];
};

export const researchDomains: ResearchDomain[] = [
  {
    id: "history",
    name: "التاريخ",
    shortName: "تاريخ",
    description:
      "تحليل المصادر التاريخية، واستخراج الأشخاص والأماكن والأحداث والعلاقات والتسلسل الزمني.",
    icon: Landmark,
    enabled: true,

    entityTypes: [
      {
        id: "person",
        label: "شخص",
        pluralLabel: "الأشخاص",
      },
      {
        id: "place",
        label: "مكان",
        pluralLabel: "الأماكن",
      },
      {
        id: "event",
        label: "حدث",
        pluralLabel: "الأحداث",
      },
      {
        id: "dynasty",
        label: "دولة أو أسرة حاكمة",
        pluralLabel: "الدول والأسر الحاكمة",
      },
      {
        id: "battle",
        label: "معركة",
        pluralLabel: "المعارك",
      },
      {
        id: "treaty",
        label: "معاهدة",
        pluralLabel: "المعاهدات",
      },
    ],

    analysisSections: [
      {
        id: "historical-context",
        title: "السياق التاريخي",
        description:
          "تحديد الفترة الزمنية والظروف السياسية والاجتماعية المحيطة بالموضوع.",
      },
      {
        id: "causes",
        title: "الأسباب",
        description:
          "جمع وتحليل الأسباب المباشرة وغير المباشرة الواردة في المصادر.",
      },
      {
        id: "events",
        title: "الأحداث",
        description:
          "ترتيب الأحداث والوقائع وربطها بالأشخاص والأماكن.",
      },
      {
        id: "results",
        title: "النتائج",
        description:
          "استخراج النتائج السياسية والاجتماعية والاقتصادية والحضارية.",
      },
      {
        id: "historical-significance",
        title: "الدلالة التاريخية",
        description:
          "تفسير أهمية الأدلة والوقائع داخل سياقها التاريخي.",
      },
    ],

    keywords: [
      "تاريخ",
      "عصر",
      "دولة",
      "حكم",
      "خلافة",
      "سلطان",
      "ملك",
      "معركة",
      "حرب",
      "صلح",
      "معاهدة",
      "حدث",
      "رواية",
      "مصدر",
      "مؤرخ",
    ],
  },

  {
    id: "archaeology",
    name: "الآثار",
    shortName: "آثار",
    description:
      "دراسة المواقع والقطع والنقوش والمباني والاكتشافات الأثرية.",
    icon: Building2,
    enabled: false,

    entityTypes: [
      {
        id: "site",
        label: "موقع أثري",
        pluralLabel: "المواقع الأثرية",
      },
      {
        id: "artifact",
        label: "قطعة أثرية",
        pluralLabel: "القطع الأثرية",
      },
      {
        id: "inscription",
        label: "نقش",
        pluralLabel: "النقوش",
      },
      {
        id: "period",
        label: "فترة أثرية",
        pluralLabel: "الفترات الأثرية",
      },
    ],

    analysisSections: [],
    keywords: ["آثار", "موقع", "حفائر", "نقش", "قطعة", "مبنى"],
  },

  {
    id: "literature",
    name: "الأدب واللغة",
    shortName: "أدب",
    description:
      "تحليل النصوص الأدبية والموضوعات والشخصيات والأساليب والمدارس الأدبية.",
    icon: BookOpen,
    enabled: false,

    entityTypes: [
      {
        id: "author",
        label: "مؤلف",
        pluralLabel: "المؤلفون",
      },
      {
        id: "work",
        label: "عمل أدبي",
        pluralLabel: "الأعمال الأدبية",
      },
      {
        id: "character",
        label: "شخصية أدبية",
        pluralLabel: "الشخصيات الأدبية",
      },
      {
        id: "theme",
        label: "موضوع",
        pluralLabel: "الموضوعات",
      },
      {
        id: "literary-school",
        label: "مدرسة أدبية",
        pluralLabel: "المدارس الأدبية",
      },
    ],

    analysisSections: [],
    keywords: ["أدب", "شعر", "رواية", "قصة", "نص", "مؤلف", "أسلوب"],
  },

  {
    id: "islamic-studies",
    name: "الدراسات الإسلامية",
    shortName: "دراسات إسلامية",
    description:
      "تحليل المصادر والنصوص والقضايا المرتبطة بالدراسات الإسلامية.",
    icon: ScrollText,
    enabled: false,

    entityTypes: [
      {
        id: "scholar",
        label: "عالم",
        pluralLabel: "العلماء",
      },
      {
        id: "book",
        label: "كتاب",
        pluralLabel: "الكتب",
      },
      {
        id: "concept",
        label: "مفهوم",
        pluralLabel: "المفاهيم",
      },
      {
        id: "school",
        label: "مدرسة أو مذهب",
        pluralLabel: "المدارس والمذاهب",
      },
    ],

    analysisSections: [],
    keywords: ["دراسات إسلامية", "فقه", "حديث", "تفسير", "عقيدة", "مذهب"],
  },

  {
    id: "law",
    name: "القانون",
    shortName: "قانون",
    description:
      "تحليل التشريعات والمواد القانونية والأحكام والقضايا والمبادئ القضائية.",
    icon: Scale,
    enabled: false,

    entityTypes: [
      {
        id: "law",
        label: "قانون",
        pluralLabel: "القوانين",
      },
      {
        id: "article",
        label: "مادة قانونية",
        pluralLabel: "المواد القانونية",
      },
      {
        id: "case",
        label: "قضية",
        pluralLabel: "القضايا",
      },
      {
        id: "court",
        label: "محكمة",
        pluralLabel: "المحاكم",
      },
      {
        id: "judgment",
        label: "حكم",
        pluralLabel: "الأحكام",
      },
    ],

    analysisSections: [],
    keywords: ["قانون", "مادة", "تشريع", "حكم", "محكمة", "قضية"],
  },

  {
    id: "sociology",
    name: "علم الاجتماع",
    shortName: "اجتماع",
    description:
      "دراسة الظواهر والجماعات والمؤسسات والعلاقات والتحولات الاجتماعية.",
    icon: Users,
    enabled: false,

    entityTypes: [
      {
        id: "researcher",
        label: "باحث",
        pluralLabel: "الباحثون",
      },
      {
        id: "theory",
        label: "نظرية",
        pluralLabel: "النظريات",
      },
      {
        id: "social-group",
        label: "جماعة اجتماعية",
        pluralLabel: "الجماعات الاجتماعية",
      },
      {
        id: "institution",
        label: "مؤسسة",
        pluralLabel: "المؤسسات",
      },
    ],

    analysisSections: [],
    keywords: ["مجتمع", "جماعة", "ظاهرة", "مؤسسة", "تحول اجتماعي"],
  },

  {
    id: "psychology",
    name: "علم النفس",
    shortName: "نفس",
    description:
      "تحليل النظريات والدراسات والمقاييس والظواهر النفسية.",
    icon: Brain,
    enabled: false,

    entityTypes: [
      {
        id: "researcher",
        label: "باحث",
        pluralLabel: "الباحثون",
      },
      {
        id: "theory",
        label: "نظرية",
        pluralLabel: "النظريات",
      },
      {
        id: "experiment",
        label: "تجربة",
        pluralLabel: "التجارب",
      },
      {
        id: "scale",
        label: "مقياس",
        pluralLabel: "المقاييس",
      },
    ],

    analysisSections: [],
    keywords: ["علم النفس", "سلوك", "نظرية", "تجربة", "مقياس"],
  },

  {
    id: "geography",
    name: "الجغرافيا",
    shortName: "جغرافيا",
    description:
      "تحليل الأماكن والأقاليم والسكان والبيئات والظواهر الجغرافية.",
    icon: Globe2,
    enabled: false,

    entityTypes: [
      {
        id: "place",
        label: "مكان",
        pluralLabel: "الأماكن",
      },
      {
        id: "region",
        label: "إقليم",
        pluralLabel: "الأقاليم",
      },
      {
        id: "population",
        label: "مجموعة سكانية",
        pluralLabel: "المجموعات السكانية",
      },
      {
        id: "environment",
        label: "بيئة",
        pluralLabel: "البيئات",
      },
    ],

    analysisSections: [],
    keywords: ["جغرافيا", "مكان", "إقليم", "سكان", "بيئة"],
  },

  {
    id: "political-science",
    name: "العلوم السياسية",
    shortName: "سياسة",
    description:
      "تحليل الدول والمؤسسات والنظم والقرارات والعلاقات السياسية.",
    icon: Landmark,
    enabled: false,

    entityTypes: [
      {
        id: "state",
        label: "دولة",
        pluralLabel: "الدول",
      },
      {
        id: "institution",
        label: "مؤسسة",
        pluralLabel: "المؤسسات",
      },
      {
        id: "politician",
        label: "شخصية سياسية",
        pluralLabel: "الشخصيات السياسية",
      },
      {
        id: "policy",
        label: "سياسة",
        pluralLabel: "السياسات",
      },
    ],

    analysisSections: [],
    keywords: ["سياسة", "دولة", "نظام", "مؤسسة", "قرار", "علاقات دولية"],
  },

  {
    id: "economics",
    name: "الاقتصاد",
    shortName: "اقتصاد",
    description:
      "تحليل الظواهر والسياسات والمؤسسات والبيانات الاقتصادية.",
    icon: Gavel,
    enabled: false,

    entityTypes: [
      {
        id: "economist",
        label: "اقتصادي",
        pluralLabel: "الاقتصاديون",
      },
      {
        id: "institution",
        label: "مؤسسة اقتصادية",
        pluralLabel: "المؤسسات الاقتصادية",
      },
      {
        id: "indicator",
        label: "مؤشر اقتصادي",
        pluralLabel: "المؤشرات الاقتصادية",
      },
      {
        id: "policy",
        label: "سياسة اقتصادية",
        pluralLabel: "السياسات الاقتصادية",
      },
    ],

    analysisSections: [],
    keywords: ["اقتصاد", "سوق", "تجارة", "مال", "مؤشر", "سياسة اقتصادية"],
  },
];

/**
 * يعيد بيانات تخصص واحد.
 * إذا لم يوجد التخصص، يستخدم التاريخ كتخصص افتراضي.
 */
export function getResearchDomain(
  domainId?: string | null
): ResearchDomain {
  return (
    researchDomains.find(
      (domain) => domain.id === domainId
    ) ?? researchDomains[0]
  );
}

/**
 * التخصصات المتاحة للاستخدام حاليًا.
 */
export function getEnabledResearchDomains(): ResearchDomain[] {
  return researchDomains.filter((domain) => domain.enabled);
}

/**
 * التحقق من صحة معرف التخصص.
 */
export function isResearchDomainId(
  value: string
): value is ResearchDomainId {
  return researchDomains.some(
    (domain) => domain.id === value
  );
}