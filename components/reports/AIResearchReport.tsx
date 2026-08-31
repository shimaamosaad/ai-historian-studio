import {
  CalendarDays,
  ChevronDown,
  FileText,
  Landmark,
  Lightbulb,
  Link2,
  MapPin,
  Sparkles,
  UserRound,
} from "lucide-react";

import ReportExportButtons from "./ReportExportButtons";

import {
  generateResearchConclusions,
} from "@/lib/reports/generateResearchConclusions";

type DocumentItem = {
  id: number;
  name: string;
  summary?: string | null;
  content?: string | null;
};

type RelationItem = {
  id?: number;

  relation?: string | null;

  source?: {
    id?: number;
    name?: string | null;
  } | null;

  target?: {
    id?: number;
    name?: string | null;
  } | null;

  sourceEntity?: {
    id?: number;
    name?: string | null;
  } | null;

  targetEntity?: {
    id?: number;
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
  id?: number;
  entity: EntityItem;
};

type AIResearchReportProject = {
  id: number;
  title: string;

  description?: string | null;
  period?: string | null;
  summary?: string | null;

  documents?: DocumentItem[];

  projectEntities?: ProjectEntityItem[];

  entities?: EntityItem[];
};

type AIResearchReportProps = {
  project: AIResearchReportProject;
};

function normaliseType(
  type: string
): string {
  return type
    .trim()
    .toLowerCase();
}

function getEntities(
  project: AIResearchReportProject
): EntityItem[] {
  if (
    project.projectEntities?.length
  ) {
    return project.projectEntities.map(
      (item) => item.entity
    );
  }

  return project.entities ?? [];
}

function filterEntities(
  entities: EntityItem[],
  acceptedTypes: string[]
): EntityItem[] {
  return entities.filter(
    (entity) =>
      acceptedTypes.includes(
        normaliseType(
          entity.type
        )
      )
  );
}

function createRelationText(
  relation: RelationItem
): string | null {
  const sourceName =
    relation.source?.name ??
    relation.sourceEntity?.name ??
    null;

  const targetName =
    relation.target?.name ??
    relation.targetEntity?.name ??
    null;

  const relationName =
    relation.relation?.trim();

  if (
    !sourceName ||
    !targetName ||
    !relationName
  ) {
    return null;
  }

  return `${sourceName} ${relationName} ${targetName}.`;
}

function getRelations(
  entities: EntityItem[]
): string[] {
  const relationTexts =
    entities.flatMap(
      (entity) => {
        const outgoing =
          entity.outgoingRelations ?? [];

        const incoming =
          entity.incomingRelations ?? [];

        return [
          ...outgoing,
          ...incoming,
        ]
          .map(
            createRelationText
          )
          .filter(
            (
              item
            ): item is string =>
              Boolean(item)
          );
      }
    );

  return Array.from(
    new Set(
      relationTexts
    )
  );
}

type ReportSectionProps = {
  icon: React.ReactNode;
  title: string;

  description?: string;

  count?: number;

  children: React.ReactNode;
};

function ReportSection({
  icon,
  title,
  description,
  count,
  children,
}: ReportSectionProps) {
  return (
    <details
      className="
        group overflow-hidden
        rounded-2xl
        border border-white/10
        bg-[#0b1728]/80
        shadow-lg shadow-black/10
        transition
        open:border-amber-300/20
      "
    >
      <summary
        className="
          flex cursor-pointer
          list-none items-center
          justify-between gap-4
          px-4 py-4 sm:px-6
          transition
          hover:bg-white/[0.025]
          sm:px-6
          [&::-webkit-details-marker]:hidden
        "
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div
            className="
              flex h-11 w-11
              shrink-0 items-center
              justify-center
              rounded-xl
              border border-amber-300/10
              bg-amber-300/[0.07]
              text-amber-300
            "
          >
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 sm:text-lg">
                {title}
              </h2>

              {typeof count ===
                "number" && (
                <span
                  className="
                    rounded-full
                    border border-white/10
                    bg-white/[0.04]
                    px-2.5 py-0.5
                    text-xs font-semibold
                    text-slate-400
                  "
                >
                  {count}
                </span>
              )}
            </div>

            {description ? (
              <p
                className="
                  mt-1 hidden
                  text-sm leading-6
                  text-slate-500
                  sm:block
                "
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <ChevronDown
          className="
            h-5 w-5
            shrink-0
            text-slate-500
            transition-transform
            duration-200
            group-open:rotate-180
            group-open:text-amber-300
          "
        />
      </summary>

      <div
        className="
          border-t border-white/[0.07]
          px-4 py-5 sm:px-6
          sm:px-6
        "
      >
        {children}
      </div>
    </details>
  );
}

function EmptySection({
  message,
}: {
  message: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border border-dashed
        border-white/10
        bg-slate-950/20
        px-4 py-6
        text-center
      "
    >
      <p className="text-sm leading-7 text-slate-500">
        {message}
      </p>
    </div>
  );
}

function EntityCards({
  entities,
}: {
  entities: EntityItem[];
}) {
  if (
    entities.length === 0
  ) {
    return (
      <EmptySection
        message="لم يتم العثور على بيانات في هذا القسم."
      />
    );
  }

  return (
    <div
      className="
        grid gap-3
        sm:grid-cols-2
        lg:grid-cols-3
      "
    >
      {entities.map(
        (entity) => (
          <article
            key={entity.id}
            className="
              rounded-xl
              border border-white/[0.07]
              bg-slate-950/30
              px-4 py-3
              transition
              hover:border-amber-300/15
              hover:bg-slate-950/50
            "
          >
            <h3 className="font-semibold text-slate-200">
              {entity.name}
            </h3>

            {entity.summary ||
            entity.description ? (
              <p
                className="
                  mt-2 line-clamp-3
                  text-sm leading-7
                  text-slate-500
                "
              >
                {entity.summary ??
                  entity.description}
              </p>
            ) : null}
          </article>
        )
      )}
    </div>
  );
}

export default function AIResearchReport({
  project,
}: AIResearchReportProps) {
  const entities =
    getEntities(project);

  const people =
    filterEntities(
      entities,
      [
        "person",
        "people",
        "character",
        "شخص",
        "شخصية",
      ]
    );

  const places =
    filterEntities(
      entities,
      [
        "place",
        "location",
        "city",
        "country",
        "مكان",
        "مدينة",
        "دولة",
      ]
    );

  const events =
    filterEntities(
      entities,
      [
        "event",
        "battle",
        "war",
        "حدث",
        "معركة",
        "حرب",
      ]
    );

  const relations =
    getRelations(
      entities
    );

  const documents =
    project.documents ?? [];

  const researchConclusions =
    generateResearchConclusions({
      projectTitle:
        project.title,

      projectSummary:
        project.summary,

      projectDescription:
        project.description,

      projectPeriod:
        project.period,

      people,
      places,
      events,
      relations,
      documents,
    });

  const generatedDate =
    new Intl.DateTimeFormat(
      "ar-EG",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(
      new Date()
    );

  return (
    <div
      dir="rtl"
      className="space-y-4"
    >
      {/* ========================= */}
      {/* COMPACT REPORT HEADER */}
      {/* ========================= */}

      <header
        className="
          relative overflow-hidden
          rounded-3xl
          border border-amber-300/15
          bg-[#081526]
          px-4 py-5 sm:px-7 sm:py-6
          shadow-xl shadow-black/15
          sm:px-7
        "
      >
        <div
          className="
            pointer-events-none
            absolute -left-24 -top-24
            h-48 w-48
            rounded-full
            bg-amber-400/[0.07]
            blur-3xl
          "
        />

        <div className="relative">
          <div
            className="
              flex flex-col gap-5
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  inline-flex
                  items-center gap-2
                  rounded-full
                  border border-amber-300/15
                  bg-amber-300/[0.07]
                  px-3 py-1.5
                  text-xs font-semibold
                  text-amber-200
                "
              >
                <Sparkles className="h-4 w-4" />

                التقرير البحثي
              </div>

              <h1
                className="
                  mt-4
                  text-2xl font-black
                  leading-tight
                  text-white
                  sm:text-3xl
                "
              >
                {project.title}
              </h1>

              {project.description ? (
                <p
                  className="
                    mt-3
                    max-w-4xl
                    text-sm leading-7
                    text-slate-400
                  "
                >
                  {project.description}
                </p>
              ) : null}
            </div>

            <div className="shrink-0">
              <ReportExportButtons
                project={project}
              />
            </div>
          </div>

          {/* Small metadata */}
          <div
            className="
              mt-5 flex
              flex-wrap gap-2
              text-xs text-slate-400
            "
          >
            {project.period ? (
              <div
                className="
                  flex items-center gap-2
                  rounded-lg
                  border border-white/[0.07]
                  bg-white/[0.025]
                  px-3 py-2
                "
              >
                <CalendarDays className="h-4 w-4 text-amber-300" />

                <span>
                  {project.period}
                </span>
              </div>
            ) : null}

            <div
              className="
                flex items-center gap-2
                rounded-lg
                border border-white/[0.07]
                bg-white/[0.025]
                px-3 py-2
              "
            >
              <FileText className="h-4 w-4 text-amber-300" />

              <span>
                {documents.length} مستند
              </span>
            </div>

            <div
              className="
                flex items-center gap-2
                rounded-lg
                border border-white/[0.07]
                bg-white/[0.025]
                px-3 py-2
              "
            >
              <CalendarDays className="h-4 w-4 text-amber-300" />

              <span>
                {generatedDate}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================= */}
      {/* REPORT ACCORDIONS */}
      {/* ========================= */}

      <div className="space-y-3">

        {/* Main analysis */}
        
        {/* People */}
        <ReportSection
          icon={
            <UserRound className="h-5 w-5" />
          }
          title="الشخصيات"
          description="الشخصيات التي تم استخراجها من مستندات المشروع."
          count={people.length}
        >
          <EntityCards
            entities={people}
          />
        </ReportSection>

        {/* Places */}
        <ReportSection
          icon={
            <MapPin className="h-5 w-5" />
          }
          title="الأماكن"
          description="الأماكن والمجالات الجغرافية المرتبطة بالمحتوى."
          count={places.length}
        >
          <EntityCards
            entities={places}
          />
        </ReportSection>

        {/* Events */}
        <ReportSection
          icon={
            <Landmark className="h-5 w-5" />
          }
          title="الأحداث"
          description="الأحداث التاريخية المستخرجة من مستندات المشروع."
          count={events.length}
        >
          <EntityCards
            entities={events}
          />
        </ReportSection>

        {/* Relations */}
        <ReportSection
          icon={
            <Link2 className="h-5 w-5" />
          }
          title="العلاقات المعرفية"
          description="العلاقات المسجلة بين الشخصيات والأماكن والأحداث."
          count={relations.length}
        >
          {relations.length > 0 ? (
            <div className="space-y-2">
              {relations.map(
                (
                  relation,
                  index
                ) => (
                  <div
                    key={`${relation}-${index}`}
                    className="
                      flex gap-3
                      rounded-xl
                      border border-white/[0.07]
                      bg-slate-950/30
                      px-4 py-3
                    "
                  >
                    <div
                      className="
                        mt-2.5
                        h-1.5 w-1.5
                        shrink-0
                        rounded-full
                        bg-amber-300
                      "
                    />

                    <p
                      className="
                        text-sm
                        leading-7
                        text-slate-300
                      "
                    >
                      {relation}
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <EmptySection
              message="لم يتم تسجيل علاقات معرفية كافية حتى الآن."
            />
          )}
        </ReportSection>

        {/* Conclusions */}
        <ReportSection
          icon={
            <Lightbulb className="h-5 w-5" />
          }
          title="الاستنتاجات البحثية"
          description="قراءة تحليلية أولية للبيانات المستخرجة من المشروع."
          count={
            researchConclusions.length
          }
        >
          {researchConclusions.length >
          0 ? (
            <div className="space-y-3">
              {researchConclusions.map(
                (
                  conclusion,
                  index
                ) => (
                  <div
                    key={`${index}-${conclusion.slice(
                      0,
                      30
                    )}`}
                    className="
                      flex gap-3
                      rounded-xl
                      border border-white/[0.07]
                      bg-slate-950/30
                      p-4
                    "
                  >
                    <span
                      className="
                        flex h-7 w-7
                        shrink-0 items-center
                        justify-center
                        rounded-full
                        bg-amber-300/10
                        text-xs font-bold
                        text-amber-200
                      "
                    >
                      {index + 1}
                    </span>

                    <p
                      className="
                        text-sm
                        leading-8
                        text-slate-300
                      "
                    >
                      {conclusion}
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <EmptySection
              message="لا توجد استنتاجات بحثية متاحة حتى الآن."
            />
          )}
        </ReportSection>

        {/* Sources */}
        <ReportSection
          icon={
            <FileText className="h-5 w-5" />
          }
          title="المصادر والمستندات"
          description="المستندات المرتبطة بهذا المشروع."
          count={documents.length}
        >
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map(
                (
                  document,
                  index
                ) => (
                  <div
                    key={
                      document.id
                    }
                    className="
                      flex items-center gap-3
                      rounded-xl
                      border border-white/[0.07]
                      bg-slate-950/30
                      px-4 py-3
                    "
                  >
                    <div
                      className="
                        flex h-9 w-9
                        shrink-0 items-center
                        justify-center
                        rounded-lg
                        bg-amber-300/[0.08]
                        text-sm font-bold
                        text-amber-300
                      "
                    >
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate
                          font-semibold
                          text-slate-200
                        "
                      >
                        {document.name}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <EmptySection
              message="لا توجد مستندات مرتبطة بهذا المشروع."
            />
          )}
        </ReportSection>
      </div>

      {/* Compact footer */}
      <footer
        className="
          rounded-xl
          border border-white/[0.06]
          bg-white/[0.015]
          px-4 py-3
          text-center
        "
      >
        <p
          className="
            text-xs
            leading-6
            text-slate-600
          "
        >
          تقرير بحثي تم إنشاؤه داخل منصة أثر.
        </p>
      </footer>
    </div>
  );
}