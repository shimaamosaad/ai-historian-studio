import { prisma } from "@/lib/prisma";
import type {
  AIAnalysisResult,
  AIRelation,
} from "@/lib/ai/analyzeDocument";

function normalizeName(text: string): string {
  return text
    .trim()
    .replace(/^(السلطان|الملك|القائد|الأمير)\s+/u, "")
    .replace(/الايوبي/g, "الأيوبي")
    .replace(/\s+/g, " ");
}

function slugify(text: string): string {
  return normalizeName(text)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "");
}

async function saveEntity(
  projectId: number,
  name: string,
  type: "person" | "place" | "event"
) {
  const cleanName = normalizeName(name);

  if (!cleanName) return null;

  const slug = slugify(cleanName);

  let entity = await prisma.entity.findUnique({
    where: {
      slug,
    },
  });

  if (!entity) {
    entity = await prisma.entity.create({
      data: {
        name: cleanName,
        slug,
        type,
      },
    });

    console.log("Created Entity:", entity.name);
  } else {
    console.log("Existing Entity:", entity.name);
  }

  const relation = await prisma.projectEntity.findUnique({
    where: {
      projectId_entityId: {
        projectId,
        entityId: entity.id,
      },
    },
  });

  if (!relation) {
    await prisma.projectEntity.create({
      data: {
        projectId,
        entityId: entity.id,
      },
    });

    console.log(
      `Linked Entity "${entity.name}" to Project ${projectId}`
    );
  }

  return entity;
}

async function saveRelation(
  projectId: number,
  relation: AIRelation
) {
  console.log("=================================");
  console.log("Saving Relation:", relation);
  console.log("=================================");

  const sourceSlug = slugify(relation.source);
  const targetSlug = slugify(relation.target);

  console.log("Source Slug:", sourceSlug);
  console.log("Target Slug:", targetSlug);

  const source = await prisma.entity.findUnique({
    where: {
      slug: sourceSlug,
    },
  });

  console.log("Source Entity:", source);

  const target = await prisma.entity.findUnique({
    where: {
      slug: targetSlug,
    },
  });

  console.log("Target Entity:", target);

  if (!source || !target) {
    console.log("Relation skipped because source or target was not found.");
    return;
  }

  await prisma.projectEntity.upsert({
    where: {
      projectId_entityId: {
        projectId,
        entityId: source.id,
      },
    },
    update: {},
    create: {
      projectId,
      entityId: source.id,
    },
  });

  await prisma.projectEntity.upsert({
    where: {
      projectId_entityId: {
        projectId,
        entityId: target.id,
      },
    },
    update: {},
    create: {
      projectId,
      entityId: target.id,
    },
  });

  const existingRelation = await prisma.entityRelation.findFirst({
    where: {
      sourceId: source.id,
      targetId: target.id,
      relation: relation.relation,
    },
  });

  console.log("Existing Relation:", existingRelation);

  if (!existingRelation) {
    const created = await prisma.entityRelation.create({
      data: {
        sourceId: source.id,
        targetId: target.id,
        relation: relation.relation,
        confidence: 1,
      },
    });

    console.log("Created Relation:", created);
  } else {
    console.log("Relation already exists.");
  }
}

export async function saveEntities(
  projectId: number,
  analysis: AIAnalysisResult
) {
  console.log("========== SAVE ENTITIES ==========");
  console.log(analysis);

  for (const person of analysis.people) {
    await saveEntity(projectId, person, "person");
  }

  for (const place of analysis.places) {
    await saveEntity(projectId, place, "place");
  }

  for (const event of analysis.events) {
    await saveEntity(projectId, event, "event");
  }

  console.log("Relations Found:", analysis.relations.length);

  for (const relation of analysis.relations) {
    await saveRelation(projectId, relation);
  }

  console.log("========== DONE ==========");
}