-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT,
    "entities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,
    CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectEntity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "entityId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectEntity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectEntity_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EntityRelation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,
    "relation" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EntityRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Entity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EntityRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Entity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Entity_slug_key" ON "Entity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEntity_projectId_entityId_key" ON "ProjectEntity"("projectId", "entityId");

-- CreateIndex
CREATE INDEX "EntityRelation_sourceId_idx" ON "EntityRelation"("sourceId");

-- CreateIndex
CREATE INDEX "EntityRelation_targetId_idx" ON "EntityRelation"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRelation_sourceId_relation_targetId_key" ON "EntityRelation"("sourceId", "relation", "targetId");
