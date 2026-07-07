import { prisma } from "@/lib/prisma";

function normalizeName(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/^(السلطان|الملك|القائد|الأمير)\s+/u, "")
    .replace(/الايوبي/g, "الأيوبي")
    .replace(/\s+/g, " ");
}

async function main() {
  console.log("Starting entity cleanup...");

  const entities = await prisma.entity.findMany({
    orderBy: {
      id: "asc",
    },
  });

  const groups = new Map<string, typeof entities>();

  for (const entity of entities) {
    const key = normalizeName(entity.name);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key)!.push(entity);
  }

  for (const [name, duplicates] of groups) {
    if (duplicates.length <= 1) continue;

    console.log(
      `Merging ${duplicates.length} entities for: ${name}`
    );

    const mainEntity = duplicates[0];

    for (const duplicate of duplicates.slice(1)) {
      const relations = await prisma.projectEntity.findMany({
        where: {
          entityId: duplicate.id,
        },
      });

      for (const relation of relations) {
        const exists = await prisma.projectEntity.findUnique({
          where: {
            projectId_entityId: {
              projectId: relation.projectId,
              entityId: mainEntity.id,
            },
          },
        });

        if (!exists) {
          await prisma.projectEntity.create({
            data: {
              projectId: relation.projectId,
              entityId: mainEntity.id,
            },
          });
        }
      }

      await prisma.projectEntity.deleteMany({
        where: {
          entityId: duplicate.id,
        },
      });

      await prisma.entity.delete({
        where: {
          id: duplicate.id,
        },
      });
    }
  }

  console.log("Cleanup finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });