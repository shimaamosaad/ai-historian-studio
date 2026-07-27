export type ResearchEntity = {
  id?: number;
  name: string;
  type: string;
  summary?: string | null;
  description?: string | null;
  outgoingRelations?: unknown[];
  incomingRelations?: unknown[];
};

export type ResearchDocument = {
  id?: number;
  name: string;
  summary?: string | null;
  content?: string | null;
};

type GenerateResearchConclusionsInput = {
  projectTitle: string;
  projectSummary?: string | null;
  projectDescription?: string | null;
  projectPeriod?: string | null;
  people: ResearchEntity[];
  places: ResearchEntity[];
  events: ResearchEntity[];
  relations: string[];
  documents: ResearchDocument[];
};

function joinArabicNames(names: string[]): string {
  const cleanNames = names.filter(Boolean);

  if (cleanNames.length === 0) {
    return "";
  }

  if (cleanNames.length === 1) {
    return cleanNames[0];
  }

  if (cleanNames.length === 2) {
    return `${cleanNames[0]} و${cleanNames[1]}`;
  }

  return `${cleanNames.slice(0, -1).join("، ")} و${
    cleanNames[cleanNames.length - 1]
  }`;
}

function countEntityRelations(entity: ResearchEntity): number {
  return (
    (entity.outgoingRelations?.length ?? 0) +
    (entity.incomingRelations?.length ?? 0)
  );
}

function getMostConnectedEntities(
  entities: ResearchEntity[],
  limit = 3
): ResearchEntity[] {
  return [...entities]
    .sort(
      (first, second) =>
        countEntityRelations(second) - countEntityRelations(first)
    )
    .filter((entity) => countEntityRelations(entity) > 0)
    .slice(0, limit);
}

function getMainResearchDirection(input: {
  peopleCount: number;
  placesCount: number;
  eventsCount: number;
  relationsCount: number;
}): string {
  const {
    peopleCount,
    placesCount,
    eventsCount,
    relationsCount,
  } = input;

  const maximum = Math.max(
    peopleCount,
    placesCount,
    eventsCount,
    relationsCount
  );

  if (maximum === 0) {
    return "لا تزال البيانات المتاحة غير كافية لتحديد الاتجاه البحثي الرئيس للمشروع.";
  }

  if (maximum === peopleCount) {
    return "تميل مادة المشروع إلى التركيز على الشخصيات التاريخية وأدوارها داخل الوقائع المدروسة.";
  }

  if (maximum === eventsCount) {
    return "تميل مادة المشروع إلى التركيز على الأحداث والتحولات التاريخية أكثر من التركيز على التراجم الفردية.";
  }

  if (maximum === placesCount) {
    return "يظهر البعد الجغرافي بصورة واضحة، مما يشير إلى أهمية الأماكن والمدن والأقاليم في تفسير موضوع المشروع.";
  }

  return "تتميز مادة المشروع بكثافة العلاقات بين الكيانات، مما يجعل تحليل الترابط بين الشخصيات والأماكن والأحداث عنصرًا أساسيًا في الدراسة.";
}

export function generateResearchConclusions({
  projectTitle,
  projectSummary,
  projectDescription,
  projectPeriod,
  people,
  places,
  events,
  relations,
  documents,
}: GenerateResearchConclusionsInput): string[] {
  const conclusions: string[] = [];

  const allEntities = [...people, ...places, ...events];
  const mostConnected = getMostConnectedEntities(allEntities);

  const namedPeople = people.slice(0, 3).map((entity) => entity.name);
  const namedPlaces = places.slice(0, 3).map((entity) => entity.name);
  const namedEvents = events.slice(0, 3).map((entity) => entity.name);

  conclusions.push(
    `يعتمد مشروع «${projectTitle}» على ${documents.length} ${
      documents.length === 1 ? "مستند" : "مستندات"
    }، وقد أسفر التحليل عن التعرف على ${people.length} من الشخصيات، و${
      places.length
    } من الأماكن، و${events.length} من الأحداث، و${
      relations.length
    } من العلاقات المعرفية.`
  );

  if (projectPeriod) {
    conclusions.push(
      `تدور المادة العلمية حول الفترة التاريخية: ${projectPeriod}، وهو ما يساعد على وضع الشخصيات والأحداث داخل سياق زمني محدد.`
    );
  }

  if (namedPeople.length > 0) {
    conclusions.push(
      `تبرز شخصيات مثل ${joinArabicNames(
        namedPeople
      )} ضمن الشخصيات الأساسية الواردة في مادة المشروع، ويشير تكرار حضورها إلى أهمية أدوارها في تفسير موضوع الدراسة.`
    );
  } else {
    conclusions.push(
      "لم يحدد التحليل شخصيات تاريخية واضحة حتى الآن، وقد يكون من المفيد إضافة مصادر أكثر وضوحًا في ذكر الأسماء والتراجم."
    );
  }

  if (namedPlaces.length > 0) {
    conclusions.push(
      `ترتبط الدراسة جغرافيًا بأماكن من أبرزها ${joinArabicNames(
        namedPlaces
      )}، مما يدل على أن البعد المكاني يمثل عنصرًا مهمًا في فهم حركة الأحداث.`
    );
  }

  if (namedEvents.length > 0) {
    conclusions.push(
      `تظهر أحداث مثل ${joinArabicNames(
        namedEvents
      )} بوصفها محاور رئيسة في المادة التاريخية التي جرى تحليلها.`
    );
  }

  if (mostConnected.length > 0) {
    conclusions.push(
      `تُعد ${joinArabicNames(
        mostConnected.map((entity) => entity.name)
      )} من أكثر الكيانات ارتباطًا داخل الشبكة المعرفية، وهو ما يرجح أنها تمثل نقاطًا مركزية يمكن الانطلاق منها في التحليل التاريخي.`
    );
  }

  conclusions.push(
    getMainResearchDirection({
      peopleCount: people.length,
      placesCount: places.length,
      eventsCount: events.length,
      relationsCount: relations.length,
    })
  );

  if (relations.length === 0 && allEntities.length > 0) {
    conclusions.push(
      "رغم وجود عدد من الكيانات التاريخية، لم تُستخرج علاقات معرفية كافية بينها؛ لذلك قد تحتاج النصوص إلى تحسين جودة الاستخراج أو إضافة مصادر أكثر تفصيلًا."
    );
  }

  if (documents.length < 2) {
    conclusions.push(
      "تعتمد النتائج الحالية على عدد محدود من المصادر، ولذلك ينبغي التعامل معها بوصفها استنتاجات أولية تحتاج إلى المقارنة بمصادر إضافية."
    );
  } else {
    conclusions.push(
      "وجود أكثر من مستند يتيح إمكانية المقارنة بين المصادر، لكن تظل مراجعة الباحث ضرورية للتأكد من دقة الأسماء والتواريخ والعلاقات."
    );
  }

  if (!projectSummary && !projectDescription) {
    conclusions.push(
      "يفضل إضافة وصف وملخص أوضح للمشروع حتى تصبح الاستنتاجات النهائية أكثر ارتباطًا بسؤال البحث وأهداف الدراسة."
    );
  }

  conclusions.push(
    "هذه النتائج تحليلية أولية مولدة آليًا، ولا تُغني عن النقد التاريخي للمصادر أو التحقق من صحة المعلومات والاختلافات بين الروايات."
  );

  return conclusions;
}