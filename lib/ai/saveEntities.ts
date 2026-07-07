import { prisma } from "@/lib/prisma";
import type { AIAnalysisResult } from "@/lib/ai/analyzeDocument";

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

  if (!cleanName) return;

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
  }

  return entity;
}

export async function saveEntities(
  projectId: number,
  analysis: AIAnalysisResult
) {
  for (const person of analysis.people) {
    await saveEntity(projectId, person, "person");
  }

  for (const place of analysis.places) {
    await saveEntity(projectId, place, "place");
  }

  for (const event of analysis.events) {
    await saveEntity(projectId, event, "event");
  }
}