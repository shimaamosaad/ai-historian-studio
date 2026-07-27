"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { generateResearchConclusions } from "@/lib/reports/generateResearchConclusions";

type DocumentItem = {
  id: number;
  name: string;
  summary?: string | null;
};

type RelationItem = {
  relation?: string | null;
  source?: {
    name?: string | null;
  } | null;
  target?: {
    name?: string | null;
  } | null;
  sourceEntity?: {
    name?: string | null;
  } | null;
  targetEntity?: {
    name?: string | null;
  } | null;
};

type EntityItem = {
  id: number;
  name: string;
  type: string;
  summary?: string | null;
  description?: string | null;
  outgoingRelations?: RelationItem[];
  incomingRelations?: RelationItem[];
};

type ProjectEntityItem = {
  entity: EntityItem;
};

export type ExportReportProject = {
  id: number;
  title: string;
  description?: string | null;
  period?: string | null;
  summary?: string | null;
  documents?: DocumentItem[];
  projectEntities?: ProjectEntityItem[];
  entities?: EntityItem[];
};

type ReportExportButtonsProps = {
  project: ExportReportProject;
};

function normalizeType(type: string): string {
  return type.trim().toLowerCase();
}

function getEntities(project: ExportReportProject): EntityItem[] {
  if (project.projectEntities?.length) {
    return project.projectEntities.map((item) => item.entity);
  }

  return project.entities ?? [];
}

function getEntitiesByType(
  entities: EntityItem[],
  acceptedTypes: string[]
): EntityItem[] {
  return entities.filter((entity) =>
    acceptedTypes.includes(normalizeType(entity.type))
  );
}

function getRelationText(relation: RelationItem): string | null {
  const sourceName =
    relation.source?.name ?? relation.sourceEntity?.name ?? null;

  const targetName =
    relation.target?.name ?? relation.targetEntity?.name ?? null;

  const relationName = relation.relation?.trim();

  if (!sourceName || !targetName || !relationName) {
    return null;
  }

  return `${sourceName} ${relationName} ${targetName}.`;
}

function getRelations(entities: EntityItem[]): string[] {
  const relations = entities.flatMap((entity) => [
    ...(entity.outgoingRelations ?? []),
    ...(entity.incomingRelations ?? []),
  ]);

  return Array.from(
    new Set(
      relations
        .map(getRelationText)
        .filter((item): item is string => Boolean(item))
    )
  );
}

function createHeading(
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel]
): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: {
      before: 240,
      after: 160,
    },
  });
}

function createTextParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: {
      after: 140,
      line: 360,
    },
    children: [
      new TextRun({
        text,
        size: 28,
        font: "Arial",
        rightToLeft: true,
      }),
    ],
  });
}

function createBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    bullet: {
      level: 0,
    },
    spacing: {
      after: 100,
      line: 320,
    },
    children: [
      new TextRun({
        text,
        size: 26,
        font: "Arial",
        rightToLeft: true,
      }),
    ],
  });
}

function createEntityParagraph(entity: EntityItem): Paragraph {
  const description =
    entity.summary ?? entity.description ?? "لا يوجد وصف متاح.";

  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    spacing: {
      after: 140,
      line: 340,
    },
    children: [
      new TextRun({
        text: `${entity.name}: `,
        bold: true,
        size: 28,
        font: "Arial",
        rightToLeft: true,
      }),
      new TextRun({
        text: description,
        size: 26,
        font: "Arial",
        rightToLeft: true,
      }),
    ],
  });
}

function safeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export default function ReportExportButtons({
  project,
}: ReportExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function exportToWord() {
    try {
      setIsExporting(true);

      const entities = getEntities(project);

      const people = getEntitiesByType(entities, [
        "person",
        "people",
        "character",
        "شخص",
        "شخصية",
      ]);

      const places = getEntitiesByType(entities, [
        "place",
        "location",
        "city",
        "country",
        "مكان",
        "مدينة",
        "دولة",
      ]);

      const events = getEntitiesByType(entities, [
        "event",
        "battle",
        "war",
        "حدث",
        "معركة",
        "حرب",
      ]);

      const relations = getRelations(entities);
      const documents = project.documents ?? [];

const researchConclusions = generateResearchConclusions({
  projectTitle: project.title,
  projectSummary: project.summary,
  projectDescription: project.description,
  projectPeriod: project.period,
  people,
  places,
  events,
  relations,
  documents,
});

      const generatedDate = new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date());

      const content: Paragraph[] = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          bidirectional: true,
          spacing: {
            after: 240,
          },
          children: [
            new TextRun({
              text: "تقرير أثر البحثي",
              bold: true,
              size: 44,
              font: "Arial",
              rightToLeft: true,
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          bidirectional: true,
          spacing: {
            after: 160,
          },
          children: [
            new TextRun({
              text: project.title,
              bold: true,
              size: 36,
              font: "Arial",
              rightToLeft: true,
            }),
          ],
        }),

        createTextParagraph(`تاريخ إنشاء التقرير: ${generatedDate}`),

        ...(project.period
          ? [createTextParagraph(`الفترة التاريخية: ${project.period}`)]
          : []),

        createTextParagraph(`عدد المستندات: ${documents.length}`),

        createHeading("الملخص التنفيذي", HeadingLevel.HEADING_1),

        project.summary
          ? createTextParagraph(project.summary)
          : createTextParagraph(
              "لم يتم إنشاء ملخص للمشروع حتى الآن."
            ),

        createHeading("النظرة التاريخية العامة", HeadingLevel.HEADING_1),

        project.description
          ? createTextParagraph(project.description)
          : createTextParagraph(
              "لا تتوفر نظرة تاريخية عامة في الوقت الحالي."
            ),

        createHeading("الشخصيات التاريخية", HeadingLevel.HEADING_1),

        ...(people.length
          ? people.map(createEntityParagraph)
          : [createTextParagraph("لم يتم العثور على شخصيات تاريخية.")]),

        createHeading("الأماكن التاريخية", HeadingLevel.HEADING_1),

        ...(places.length
          ? places.map(createEntityParagraph)
          : [createTextParagraph("لم يتم العثور على أماكن تاريخية.")]),

        createHeading("الأحداث التاريخية", HeadingLevel.HEADING_1),

        ...(events.length
          ? events.map(createEntityParagraph)
          : [createTextParagraph("لم يتم العثور على أحداث تاريخية.")]),

        createHeading("العلاقات المعرفية", HeadingLevel.HEADING_1),

        ...(relations.length
          ? relations.map(createBulletParagraph)
          : [createTextParagraph("لم يتم العثور على علاقات معرفية.")]),

        createHeading(
  "الاستنتاجات البحثية الذكية",
  HeadingLevel.HEADING_1
),

...researchConclusions.map((conclusion) =>
  createBulletParagraph(conclusion)
),
        createHeading("المصادر والمستندات", HeadingLevel.HEADING_1),

        ...(documents.length
          ? documents.map((document, index) =>
              createBulletParagraph(`${index + 1}. ${document.name}`)
            )
          : [createTextParagraph("لا توجد مستندات مرتبطة بالمشروع.")]),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          bidirectional: true,
          spacing: {
            before: 400,
          },
          children: [
            new TextRun({
              text: "تم إنشاء هذا التقرير بواسطة منصة أثر لتحليل الوثائق التاريخية.",
              italics: true,
              size: 22,
              font: "Arial",
              rightToLeft: true,
            }),
          ],
        }),
      ];

      const document = new Document({
        creator: "ATHAR AI",
        title: project.title,
        description: "تقرير بحثي تاريخي مولد بواسطة منصة أثر",
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 900,
                  right: 900,
                  bottom: 900,
                  left: 900,
                },
              },
            },
            children: content,
          },
        ],
      });

      const blob = await Packer.toBlob(document);

      const filename = safeFileName(project.title) || `athar-report-${project.id}`;

      saveAs(blob, `${filename}-تقرير-أثر.docx`);
    } catch (error) {
      console.error("Word export failed:", error);
      alert("حدث خطأ أثناء إنشاء ملف Word.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={exportToWord}
        disabled={isExporting}
        className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-2.5 text-sm font-bold text-amber-200 transition hover:border-amber-300/40 hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}

        {isExporting ? "جارٍ إنشاء Word..." : "تصدير Word"}

        {!isExporting ? <Download className="h-4 w-4" /> : null}
      </button>
    </div>
  );
}