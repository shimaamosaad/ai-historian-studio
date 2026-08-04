export type SectionRelation = {
  source: string;
  relation: string;
  target: string;
};

export type SectionAnalysisResult = {
  summary: string;
  analysis: string;
  people: string[];
  places: string[];
  events: string[];
  relations: SectionRelation[];
  keywords: string[];
};

export const SECTION_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    summary: {
      type: "string",
      description:
        "ملخص أكاديمي مركز لأهم ما ورد في هذا الجزء من المستند.",
    },

    analysis: {
      type: "string",
      description:
        "تحليل تاريخي يوضح الأفكار والأسباب والنتائج والسياق والعلاقات الواردة في الجزء.",
    },

    people: {
      type: "array",
      description:
        "أسماء الشخصيات الواردة في الجزء بعد توحيد الصياغة قدر الإمكان.",
      items: {
        type: "string",
      },
    },

    places: {
      type: "array",
      description:
        "الأماكن والمدن والأقاليم والدول والمواقع التاريخية الواردة في الجزء.",
      items: {
        type: "string",
      },
    },

    events: {
      type: "array",
      description:
        "الأحداث والوقائع والمعارك والحركات والتطورات التاريخية الواردة في الجزء.",
      items: {
        type: "string",
      },
    },

    relations: {
      type: "array",
      description:
        "العلاقات المدعومة بمحتوى الجزء بين الشخصيات أو الأماكن أو الأحداث.",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          source: {
            type: "string",
            description:
              "اسم الكيان مصدر العلاقة.",
          },

          relation: {
            type: "string",
            description:
              "وصف عربي مختصر ودقيق للعلاقة.",
          },

          target: {
            type: "string",
            description:
              "اسم الكيان هدف العلاقة.",
          },
        },

        required: [
          "source",
          "relation",
          "target",
        ],
      },
    },

    keywords: {
      type: "array",
      description:
        "أهم المصطلحات والكلمات المفتاحية التي تمثل موضوعات الجزء.",
      items: {
        type: "string",
      },
    },
  },

  required: [
    "summary",
    "analysis",
    "people",
    "places",
    "events",
    "relations",
    "keywords",
  ],
} as const;

function cleanString(
  value: unknown
): string {
  return typeof value === "string"
    ? value
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

/*
 * تُستخدم في الملخص والتقرير التحليلي،
 * وتحافظ على الفقرات والعناوين والأسطر.
 */
function cleanMultilineText(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueStrings(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) =>
          cleanString(item)
        )
        .filter(Boolean)
    )
  );
}

function validateRelations(
  value: unknown
): SectionRelation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const relations: SectionRelation[] =
    [];

  const seen = new Set<string>();

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object"
    ) {
      continue;
    }

    const candidate = item as {
      source?: unknown;
      relation?: unknown;
      target?: unknown;
    };

    const source = cleanString(
      candidate.source
    );

    const relation = cleanString(
      candidate.relation
    );

    const target = cleanString(
      candidate.target
    );

    if (
      !source ||
      !relation ||
      !target
    ) {
      continue;
    }

    const duplicateKey =
      `${source}|${relation}|${target}`
        .toLowerCase();

    if (seen.has(duplicateKey)) {
      continue;
    }

    seen.add(duplicateKey);

    relations.push({
      source,
      relation,
      target,
    });
  }

  return relations;
}

export function validateSectionAnalysis(
  value: unknown
): SectionAnalysisResult {
  if (
    !value ||
    typeof value !== "object"
  ) {
    throw new Error(
      "أعاد OpenAI نتيجة غير صالحة لتحليل قسم المستند."
    );
  }

  const result = value as {
    summary?: unknown;
    analysis?: unknown;
    people?: unknown;
    places?: unknown;
    events?: unknown;
    relations?: unknown;
    keywords?: unknown;
  };

  const summary =
  cleanMultilineText(
    result.summary
  );

const analysis =
  cleanMultilineText(
    result.analysis
  );

  if (!summary) {
    throw new Error(
      "لم يُرجع OpenAI ملخصًا صالحًا لقسم المستند."
    );
  }

  if (!analysis) {
    throw new Error(
      "لم يُرجع OpenAI تحليلًا صالحًا لقسم المستند."
    );
  }

  return {
    summary,

    analysis,

    people: uniqueStrings(
      result.people
    ),

    places: uniqueStrings(
      result.places
    ),

    events: uniqueStrings(
      result.events
    ),

    relations: validateRelations(
      result.relations
    ),

    keywords: uniqueStrings(
      result.keywords
    ),
  };
}