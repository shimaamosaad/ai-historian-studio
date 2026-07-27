import {
  BookOpen,
  CalendarDays,
  FileText,
  Landmark,
  Lightbulb,
  Link2,
  MapPin,
  ScrollText,
  Sparkles,
  UserRound,
} from "lucide-react";
import ReportExportButtons from "./ReportExportButtons";
import { generateResearchConclusions } from "@/lib/reports/generateResearchConclusions";

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

function normaliseType(type: string): string {
  return type.trim().toLowerCase();
}

function getEntities(project: AIResearchReportProject): EntityItem[] {
  if (project.projectEntities?.length) {
    return project.projectEntities.map((item) => item.entity);
  }

  return project.entities ?? [];
}

function filterEntities(
  entities: EntityItem[],
  acceptedTypes: string[]
): EntityItem[] {
  return entities.filter((entity) =>
    acceptedTypes.includes(normaliseType(entity.type))
  );
}

function createRelationText(relation: RelationItem): string | null {
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
  const relationTexts = entities.flatMap((entity) => {
    const outgoing = entity.outgoingRelations ?? [];
    const incoming = entity.incomingRelations ?? [];

    return [...outgoing, ...incoming]
      .map(createRelationText)
      .filter((item): item is string => Boolean(item));
  });

  return Array.from(new Set(relationTexts));
}

function ReportSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10">
      <div className="border-b border-white/10 bg-slate-900/80 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>

            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-6 text-center">
      <p className="text-sm leading-7 text-slate-400">{message}</p>
    </div>
  );
}

function EntityCards({ entities }: { entities: EntityItem[] }) {
  if (entities.length === 0) {
    return <EmptySection message="لم يتم العثور على بيانات في هذا القسم." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entities.map((entity) => (
        <article
          key={entity.id}
          className="rounded-xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-amber-300/20 hover:bg-slate-950/60"
        >
          <h3 className="font-bold text-slate-100">{entity.name}</h3>

          {entity.summary || entity.description ? (
            <p className="mt-2 text-sm leading-7 text-slate-400">
              {entity.summary ?? entity.description}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              لا يوجد وصف متاح لهذه البيانات بعد.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

export default function AIResearchReport({
  project,
}: AIResearchReportProps) {
  const entities = getEntities(project);

  const people = filterEntities(entities, [
    "person",
    "people",
    "character",
    "شخص",
    "شخصية",
  ]);

  const places = filterEntities(entities, [
    "place",
    "location",
    "city",
    "country",
    "مكان",
    "مدينة",
    "دولة",
  ]);

  const events = filterEntities(entities, [
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

  return (
    <div dir="rtl" className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-amber-300/15 bg-slate-950 px-6 py-8 shadow-2xl shadow-black/20 sm:px-8">
        <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative">
            <div className="mb-5 flex justify-end">
  <ReportExportButtons project={project} />
</div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200">
            <Sparkles className="h-4 w-4" />
            تقرير أثر البحثي
          </div>

          <h1 className="max-w-4xl text-3xl font-black leading-tight text-white sm:text-4xl">
            {project.title}
          </h1>

          {project.description ? (
            <p className="mt-4 max-w-4xl text-sm leading-8 text-slate-300 sm:text-base">
              {project.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
            {project.period ? (
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <CalendarDays className="h-4 w-4 text-amber-300" />
                <span>{project.period}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <FileText className="h-4 w-4 text-amber-300" />
              <span>{documents.length} مستند</span>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <CalendarDays className="h-4 w-4 text-amber-300" />
              <span>تاريخ الإنشاء: {generatedDate}</span>
            </div>
          </div>
        </div>
      </header>

      <ReportSection
        icon={<ScrollText className="h-5 w-5" />}
        title="الملخص التنفيذي"
        description="نظرة عامة على موضوع المشروع ونتائج تحليل مستنداته."
      >
        {project.summary ? (
          <p className="whitespace-pre-line text-sm leading-8 text-slate-300 sm:text-base">
            {project.summary}
          </p>
        ) : (
          <EmptySection message="لم يتم إنشاء ملخص للمشروع حتى الآن." />
        )}
      </ReportSection>

      <ReportSection
        icon={<BookOpen className="h-5 w-5" />}
        title="النظرة التاريخية العامة"
        description="عرض موجز للإطار التاريخي الذي يتناوله المشروع."
      >
        {project.description || project.summary ? (
          <div className="space-y-4 text-sm leading-8 text-slate-300 sm:text-base">
            {project.description ? <p>{project.description}</p> : null}

            {project.summary && project.summary !== project.description ? (
              <p>{project.summary}</p>
            ) : null}
          </div>
        ) : (
          <EmptySection message="لا تتوفر نظرة تاريخية عامة في الوقت الحالي." />
        )}
      </ReportSection>

      <ReportSection
        icon={<UserRound className="h-5 w-5" />}
        title="الشخصيات التاريخية"
        description={`تم العثور على ${people.length} شخصية مرتبطة بالمشروع.`}
      >
        <EntityCards entities={people} />
      </ReportSection>

      <ReportSection
        icon={<MapPin className="h-5 w-5" />}
        title="الأماكن التاريخية"
        description={`تم العثور على ${places.length} مكانًا مرتبطًا بالمشروع.`}
      >
        <EntityCards entities={places} />
      </ReportSection>

      <ReportSection
        icon={<Landmark className="h-5 w-5" />}
        title="الأحداث التاريخية"
        description={`تم العثور على ${events.length} حدثًا مرتبطًا بالمشروع.`}
      >
        <EntityCards entities={events} />
      </ReportSection>

      <ReportSection
        icon={<Link2 className="h-5 w-5" />}
        title="العلاقات المعرفية"
        description="تحويل العلاقات بين الكيانات إلى عبارات نصية واضحة."
      >
        {relations.length > 0 ? (
          <div className="space-y-3">
            {relations.map((relation, index) => (
              <div
                key={`${relation}-${index}`}
                className="flex gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-300" />

                <p className="text-sm leading-7 text-slate-300">{relation}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection message="لم يتم تسجيل علاقات معرفية كافية لعرضها في التقرير." />
        )}
      </ReportSection>

      <ReportSection
        icon={<Lightbulb className="h-5 w-5" />}
        title="الاستنتاجات البحثية الذكية"
description="قراءة تحليلية أولية للبيانات والعلاقات المستخرجة من مستندات المشروع."
      >
        <div className="space-y-4">
  {researchConclusions.map((conclusion, index) => (
    <div
      key={`${index}-${conclusion.slice(0, 30)}`}
      className="flex gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-4"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300/10 text-sm font-bold text-amber-200">
        {index + 1}
      </span>

      <p className="leading-8 text-slate-300">
        {conclusion}
      </p>
    </div>
  ))}
</div>
        <p className="mt-5 rounded-xl border border-amber-300/10 bg-amber-300/5 p-4 text-sm leading-8 text-slate-300">
          هذه النتائج أولية ومبنية على البيانات التي تم استخراجها من مستندات
          المشروع. ستتم إضافة الاستنتاجات التحليلية المتقدمة عند ربط التقرير
          بنموذج الذكاء الاصطناعي.
        </p>
      </ReportSection>

      <ReportSection
        icon={<FileText className="h-5 w-5" />}
        title="المصادر والمستندات"
        description="المستندات التي اعتمد عليها التقرير."
      >
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((document, index) => (
              <div
                key={document.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-300/10 text-sm font-bold text-amber-300">
                  {index + 1}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-200">
                    {document.name}
                  </p>

                  {document.summary ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500">
                      {document.summary}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptySection message="لا توجد مستندات مرتبطة بهذا المشروع." />
        )}
      </ReportSection>

      <footer className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 text-center">
        <p className="text-xs leading-6 text-slate-500">
          تم إنشاء هذا التقرير داخل منصة أثر لتحليل الوثائق التاريخية وتنظيم
          المعرفة البحثية.
        </p>
      </footer>
    </div>
  );
}