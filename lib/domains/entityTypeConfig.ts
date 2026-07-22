import {
  researchDomains,
  type ResearchDomain,
  type ResearchDomainId,
} from "@/lib/domains/domainConfig";

export type DomainEntityType =
  ResearchDomain["entityTypes"][number];

export type DomainEntityTypeId =
  DomainEntityType["id"];

/**
 * الحصول على إعدادات تخصص محدد.
 */
export function getResearchDomain(
  domainId: ResearchDomainId
): ResearchDomain {
  const domain = researchDomains.find(
    (item) => item.id === domainId
  );

  if (!domain) {
    throw new Error(
      `تخصص غير معروف: ${domainId}`
    );
  }

  return domain;
}

/**
 * الحصول على أنواع الكيانات الخاصة بتخصص محدد.
 */
export function getDomainEntityTypes(
  domainId: ResearchDomainId
): DomainEntityType[] {
  return getResearchDomain(domainId).entityTypes;
}

/**
 * البحث عن نوع كيان داخل تخصص محدد.
 */
export function getDomainEntityType(
  domainId: ResearchDomainId,
  entityTypeId: string
): DomainEntityType | null {
  const entityTypes =
    getDomainEntityTypes(domainId);

  return (
    entityTypes.find(
      (entityType) =>
        entityType.id === entityTypeId
    ) ?? null
  );
}

/**
 * إرجاع الاسم المفرد لنوع الكيان.
 *
 * في حالة عدم العثور عليه، نعيد المعرّف نفسه
 * حتى لا تتعطل الواجهة.
 */
export function getEntityTypeLabel(
  domainId: ResearchDomainId,
  entityTypeId: string
): string {
  const entityType = getDomainEntityType(
    domainId,
    entityTypeId
  );

  return entityType?.label ?? entityTypeId;
}

/**
 * إرجاع الاسم الجمع لنوع الكيان.
 */
export function getEntityTypePluralLabel(
  domainId: ResearchDomainId,
  entityTypeId: string
): string {
  const entityType = getDomainEntityType(
    domainId,
    entityTypeId
  );

  return (
    entityType?.pluralLabel ??
    entityType?.label ??
    entityTypeId
  );
}

/**
 * التأكد من أن نوع الكيان مسجل داخل التخصص.
 */
export function isDomainEntityType(
  domainId: ResearchDomainId,
  entityTypeId: string
): boolean {
  return (
    getDomainEntityType(
      domainId,
      entityTypeId
    ) !== null
  );
}

/**
 * التخصص الوحيد المفعّل حاليًا هو التاريخ،
 * لكن الدالة جاهزة للتخصصات القادمة.
 */
export function getEnabledResearchDomains():
  ResearchDomain[] {
  return researchDomains.filter(
    (domain) => domain.enabled
  );
}

/**
 * الحصول على التخصص المفعّل أو الرجوع للتاريخ.
 */
export function resolveResearchDomain(
  domainId?: string | null
): ResearchDomain {
  const domain = researchDomains.find(
    (item) =>
      item.id === domainId &&
      item.enabled
  );

  if (domain) {
    return domain;
  }

  return getResearchDomain("history");
}