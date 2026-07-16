-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT,
    "entities" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "processedPages" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "processingError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,
    CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("content", "createdAt", "entities", "id", "name", "projectId", "summary", "type", "url") SELECT "content", "createdAt", "entities", "id", "name", "projectId", "summary", "type", "url" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
