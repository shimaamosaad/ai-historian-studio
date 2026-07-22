"use client";

import Link from "next/link";

import {
  getDomainEntityTypes,
  getEntityTypePluralLabel,
  resolveResearchDomain,
} from "@/lib/domains/entityTypeConfig";

import type {
  ResearchDomainId,
} from "@/lib/domains/domainConfig";

type EntityItem = {
  entity: {
    id: number;
    name: string;
    slug: string;
    type: string;
  };
};

type DocumentItem = {
  id: number;
  name?: string | null;
  fileName?: string | null;
  type?: string | null;
};

type ProjectAIAnalysisProps = {
  project: {
    summary?: string | null;
    domainId?: ResearchDomainId | null;
    domain?: ResearchDomainId | null;
    documents?: DocumentItem[];
    projectEntities?: EntityItem[];
  };
};

const ENTITY_ICONS: Record<string, string> = {
  person: "👤",
  place: "📍",
  event: "⚔️",
  battle: "⚔️",
  document: "📄",
  book: "📚",
  author: "✍️",
  character: "🎭",
  archaeological_site: "🏛️",
  artifact: "🏺",
  museum: "🏛️",
};

function getEntityIcon(entityType: string): string {
  return ENTITY_ICONS[entityType] ?? "🔹";
}

export default function ProjectAIAnalysis({
  project,
}: ProjectAIAnalysisProps) {
  const domain = resolveResearchDomain(
    project.domainId ?? project.domain ?? "history"
  );

  const entityTypes = getDomainEntityTypes(
    domain.id
  );

  const entities = project.projectEntities ?? [];
  const documents = project.documents ?? [];

  const entitiesByType = entityTypes.map(
    (entityType) => ({
      entityType,
      items: entities.filter(
        (item) =>
          item.entity.type === entityType.id
      ),
    })
  );

  const eventItems =
    entitiesByType.find(
      ({ entityType }) =>
        entityType.id === "event"
    )?.items ?? [];

  const totalEntities = entities.length;

  return (
    <section
      className="space-y-8"
      dir="rtl"
    >
      {/* ============================= */}
      {/* AI ANALYSIS HEADER */}
      {/* ============================= */}

      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-cyan-300">
              🤖 التحليل الذكي للمشروع
            </h2>

            <p className="mt-2 leading-7 text-slate-400">
              تحليل مشروع {domain.name} اعتمادًا على البيانات
              المستخرجة من المستندات والمصادر.
            </p>
          </div>

          <div className="w-fit rounded-xl bg-cyan-500/10 px-4 py-2 font-semibold text-cyan-300">
            جاهز
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* STATISTICS */}
      {/* ============================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="📄"
          title="المستندات"
          value={documents.length}
        />

        <StatCard
          icon="🔎"
          title="إجمالي الكيانات"
          value={totalEntities}
        />

        {entitiesByType
          .slice(0, 2)
          .map(({ entityType, items }) => (
            <StatCard
              key={entityType.id}
              icon={getEntityIcon(
                entityType.id
              )}
              title={entityType.pluralLabel}
              value={items.length}
            />
          ))}
      </div>

      {/* ============================= */}
      {/* SUMMARY */}
      {/* ============================= */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h3 className="mb-4 text-xl font-bold text-cyan-300">
          📄 ملخص التحليل
        </h3>

        {project.summary ? (
          <p className="whitespace-pre-line leading-8 text-slate-300">
            {project.summary}
          </p>
        ) : (
          <p className="text-slate-500">
            لا يوجد ملخص للمشروع حتى الآن.
          </p>
        )}
      </div>

      {/* ============================= */}
      {/* ENTITIES */}
      {/* ============================= */}

      <div>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-cyan-300">
            الكيانات المستخرجة
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            تُعرض أنواع الكيانات وفقًا لمجال البحث المختار.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entitiesByType.map(
            ({ entityType, items }) => (
              <EntityCard
                key={entityType.id}
                title={`${
                  getEntityIcon(entityType.id)
                } ${getEntityTypePluralLabel(
                  domain.id,
                  entityType.id
                )}`}
                type={entityType.id}
                items={items}
              />
            )
          )}
        </div>
      </div>

      {/* ============================= */}
      {/* UNREGISTERED ENTITIES */}
      {/* ============================= */}

      <UnregisteredEntities
        entities={entities}
        registeredTypes={entityTypes.map(
          (entityType) => entityType.id
        )}
      />

      {/* ============================= */}
      {/* TIMELINE */}
      {/* ============================= */}

      {eventItems.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h3 className="mb-5 text-xl font-bold text-cyan-300">
            ⏳ التسلسل الزمني
          </h3>

          <div className="space-y-4">
            {eventItems.map(
              (item, index) => (
                <div
                  key={item.entity.id}
                  className="flex items-start gap-4"
                >
                  <div className="mt-2 h-3 w-3 shrink-0 rounded-full bg-cyan-400" />

                  <div>
                    <Link
                      href={`/entities/event/${item.entity.slug}`}
                      className="font-semibold text-white transition hover:text-cyan-300"
                    >
                      {item.entity.name}
                    </Link>

                    <p className="mt-1 text-sm text-slate-400">
                      الحدث رقم {index + 1}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ============================= */}
      {/* DOCUMENTS */}
      {/* ============================= */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h3 className="mb-5 text-xl font-bold text-cyan-300">
          📄 مصادر المشروع
        </h3>

        {documents.length === 0 ? (
          <p className="text-slate-500">
            لا توجد مستندات حتى الآن.
          </p>
        ) : (
          <div className="grid gap-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="rounded-xl border border-white/10 bg-slate-800 p-4"
              >
                <div className="font-semibold text-white">
                  {document.name ||
                    document.fileName ||
                    `مستند رقم ${document.id}`}
                </div>

                {document.type && (
                  <div className="mt-1 text-sm text-slate-400">
                    {document.type}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="text-3xl">
        {icon}
      </div>

      <div className="mt-3 text-sm text-slate-400">
        {title}
      </div>

      <div className="mt-2 text-3xl font-black text-cyan-300">
        {value}
      </div>
    </div>
  );
}

function EntityCard({
  title,
  type,
  items,
}: {
  title: string;
  type: string;
  items: EntityItem[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
      <h3 className="mb-5 text-lg font-bold text-white">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-slate-500">
          لا توجد بيانات مستخرجة.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.entity.id}
              href={`/entities/${type}/${item.entity.slug}`}
              className="block rounded-xl bg-slate-800 p-3 text-white transition hover:bg-slate-700 hover:text-cyan-300"
            >
              {item.entity.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UnregisteredEntities({
  entities,
  registeredTypes,
}: {
  entities: EntityItem[];
  registeredTypes: string[];
}) {
  const unregisteredEntities =
    entities.filter(
      (item) =>
        !registeredTypes.includes(
          item.entity.type
        )
    );

  if (unregisteredEntities.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6">
      <h3 className="text-lg font-bold text-amber-300">
        كيانات إضافية
      </h3>

      <p className="mt-2 text-sm leading-7 text-slate-400">
        هذه الكيانات موجودة في المشروع، لكنها غير مسجلة بعد
        ضمن إعدادات تخصص البحث الحالي.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {unregisteredEntities.map((item) => (
          <Link
            key={item.entity.id}
            href={`/entities/${item.entity.type}/${item.entity.slug}`}
            className="rounded-xl border border-white/10 bg-slate-900 p-4 transition hover:border-amber-400/40"
          >
            <div className="font-semibold text-white">
              {item.entity.name}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              النوع: {item.entity.type}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}