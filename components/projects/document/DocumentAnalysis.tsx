"use client";

import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  FileText,
  Link2,
  MapPin,
  Tag,
  UserRound,
} from "lucide-react";

type RelationItem = {
  source?: string;
  relation?: string;
  target?: string;
};

type ParsedAnalysis = {
  summary?: string;
  analysis?: string;
  people?: string[];
  places?: string[];
  events?: string[];
  relations?: RelationItem[];
  keywords?: string[];
};

type Props = {
  entities?: string | null;
};

function parseAnalysis(
  entities?: string | null
): ParsedAnalysis | null {
  if (!entities) {
    return null;
  }

  try {
    let parsed: unknown =
      JSON.parse(entities);

    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    return parsed as ParsedAnalysis;
  } catch {
    return null;
  }
}

function cleanText(
  value?: string
): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanStrings(
  values?: string[]
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) =>
          typeof value === "string"
            ? value.trim()
            : ""
        )
        .filter(Boolean)
    )
  );
}

function cleanRelations(
  relations?: RelationItem[]
): RelationItem[] {
  if (!Array.isArray(relations)) {
    return [];
  }

  const seen = new Set<string>();

  return relations.filter((relation) => {
    const source =
      relation?.source?.trim();

    const relationText =
      relation?.relation?.trim();

    const target =
      relation?.target?.trim();

    if (
      !source ||
      !relationText ||
      !target
    ) {
      return false;
    }

    const key =
      `${source}|${relationText}|${target}`.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

type ItemSectionProps = {
  icon: React.ReactNode;
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function ItemSection({
  icon,
  title,
  count,
  children,
  defaultOpen = false,
}: ItemSectionProps) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-white/[0.07] bg-slate-950/20"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/[0.025] [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/[0.06] text-amber-300">
            {icon}
          </div>

          <span className="text-sm font-semibold text-slate-200">
            {title}
          </span>

          {typeof count === "number" && (
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-slate-500">
              {count}
            </span>
          )}
        </div>

        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180 group-open:text-amber-300" />
      </summary>

      <div className="border-t border-white/[0.06] px-4 py-4">
        {children}
      </div>
    </details>
  );
}

function StringList({
  items,
}: {
  items: string[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        لا توجد بيانات مستخرجة في هذا القسم.
      </p>
    );
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {items.map((item, index) => (
        <div
          key={`${index}-${item}`}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm leading-7 text-slate-300"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function AcademicText({
  value,
}: {
  value: string;
}) {
  const paragraphs = value
    .split(/\n+/)
    .map((paragraph) =>
      paragraph.trim()
    )
    .filter(Boolean);

  return (
    <div className="max-h-[520px] space-y-4 overflow-y-auto pl-1 text-sm leading-8 text-slate-300">
      {paragraphs.map(
        (paragraph, index) => (
          <p
            key={`${index}-${paragraph.slice(
              0,
              30
            )}`}
            className="whitespace-pre-wrap"
          >
            {paragraph}
          </p>
        )
      )}
    </div>
  );
}

export default function DocumentAnalysis({
  entities,
}: Props) {
  const parsed =
    parseAnalysis(entities);

  if (!parsed) {
    return (
      <details className="group overflow-hidden rounded-xl border border-white/10 bg-[#101b2d]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 [&::-webkit-details-marker]:hidden">
          <div>
            <p className="font-semibold text-white">
              نتائج التحليل
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              لا توجد نتائج منظمة متاحة لهذا المستند.
            </p>
          </div>

          <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" />
        </summary>
      </details>
    );
  }

  const summary =
    cleanText(parsed.summary);

  const analysis =
    cleanText(parsed.analysis);

  const people =
    cleanStrings(parsed.people);

  const places =
    cleanStrings(parsed.places);

  const events =
    cleanStrings(parsed.events);

  const keywords =
    cleanStrings(parsed.keywords);

  const relations =
    cleanRelations(parsed.relations);

  const totalItems =
    people.length +
    places.length +
    events.length +
    relations.length +
    keywords.length;

  return (
    <details className="group overflow-hidden rounded-xl border border-white/10 bg-[#101b2d]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/[0.025] [&::-webkit-details-marker]:hidden">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">
              نتائج التحليل
            </p>

            <span className="rounded-full border border-amber-300/10 bg-amber-300/[0.05] px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              {totalItems}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            التحليل والكيانات الخاصة بهذا المستند فقط
          </p>
        </div>

        <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180 group-open:text-amber-300" />
      </summary>

      <div className="space-y-2 border-t border-white/[0.07] p-3">
        {summary && (
          <ItemSection
            icon={
              <FileText className="h-4 w-4" />
            }
            title="ملخص المستند"
          >
            <AcademicText
              value={summary}
            />
          </ItemSection>
        )}

        {analysis && (
          <ItemSection
            icon={
              <BookOpenText className="h-4 w-4" />
            }
            title="التحليل الأكاديمي للمستند"
          >
            <AcademicText
              value={analysis}
            />
          </ItemSection>
        )}

        <ItemSection
          icon={
            <UserRound className="h-4 w-4" />
          }
          title="الشخصيات"
          count={people.length}
        >
          <StringList
            items={people}
          />
        </ItemSection>

        <ItemSection
          icon={
            <MapPin className="h-4 w-4" />
          }
          title="الأماكن"
          count={places.length}
        >
          <StringList
            items={places}
          />
        </ItemSection>

        <ItemSection
          icon={
            <CalendarDays className="h-4 w-4" />
          }
          title="الأحداث"
          count={events.length}
        >
          <StringList
            items={events}
          />
        </ItemSection>

        <ItemSection
          icon={
            <Link2 className="h-4 w-4" />
          }
          title="العلاقات"
          count={relations.length}
        >
          {relations.length === 0 ? (
            <p className="text-sm text-slate-500">
              لا توجد علاقات واضحة في هذا المستند.
            </p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {relations.map(
                (
                  relation,
                  index
                ) => (
                  <div
                    key={`${index}-${relation.source}-${relation.target}`}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm leading-7 text-slate-300"
                  >
                    <span className="font-semibold text-slate-200">
                      {
                        relation.source
                      }
                    </span>

                    {" — "}

                    <span className="text-amber-200">
                      {
                        relation.relation
                      }
                    </span>

                    {" — "}

                    <span className="font-semibold text-slate-200">
                      {
                        relation.target
                      }
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </ItemSection>

        <ItemSection
          icon={
            <Tag className="h-4 w-4" />
          }
          title="الكلمات المفتاحية"
          count={keywords.length}
        >
          {keywords.length === 0 ? (
            <p className="text-sm text-slate-500">
              لا توجد كلمات مفتاحية محفوظة لهذا المستند.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywords.map(
                (
                  keyword,
                  index
                ) => (
                  <span
                    key={`${index}-${keyword}`}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300"
                  >
                    {keyword}
                  </span>
                )
              )}
            </div>
          )}
        </ItemSection>
      </div>
    </details>
  );
}