-- Professor-first CV update system: accepted baseline, field locks, section mappings, change-set columns.

ALTER TYPE "ContentEventType" ADD VALUE IF NOT EXISTS 'CV_BASELINE_ACCEPTED';
ALTER TYPE "ContentEventType" ADD VALUE IF NOT EXISTS 'CV_FIELD_LOCKED';
ALTER TYPE "ContentEventType" ADD VALUE IF NOT EXISTS 'CV_SECTION_MAPPED';
ALTER TYPE "ContentEventType" ADD VALUE IF NOT EXISTS 'CV_CHANGE_SET_GENERATED';

CREATE TYPE "CvDynamicSectionPresentation" AS ENUM (
  'RICH_TEXT',
  'BULLET_LIST',
  'TIMELINE',
  'GROUPED_CARDS',
  'KEY_VALUE',
  'KEEP_IN_CV',
  'IGNORE'
);

ALTER TABLE "ContentImport" ADD COLUMN IF NOT EXISTS "changeSet" JSONB;
ALTER TABLE "ContentImport" ADD COLUMN IF NOT EXISTS "changeDecisions" JSONB;

CREATE TABLE "AcceptedCvBaseline" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'current',
    "sourceImportId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parserVersion" TEXT NOT NULL,
    "mappingVersion" TEXT NOT NULL,
    "sourceTextHash" TEXT,
    "normalizedSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcceptedCvBaseline_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcceptedCvBaseline_slot_key" ON "AcceptedCvBaseline"("slot");
CREATE INDEX "AcceptedCvBaseline_sourceImportId_idx" ON "AcceptedCvBaseline"("sourceImportId");
CREATE INDEX "AcceptedCvBaseline_acceptedAt_idx" ON "AcceptedCvBaseline"("acceptedAt");

ALTER TABLE "AcceptedCvBaseline" ADD CONSTRAINT "AcceptedCvBaseline_sourceImportId_fkey" FOREIGN KEY ("sourceImportId") REFERENCES "ContentImport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ImportFieldLock" (
    "id" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "lockedWebsiteFingerprint" TEXT NOT NULL,
    "lockedWebsiteValue" JSONB NOT NULL,
    "rejectedSourceFingerprint" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportFieldLock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ImportFieldLock_fieldPath_key" ON "ImportFieldLock"("fieldPath");

CREATE TABLE "CvSectionMapping" (
    "id" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "presentation" "CvDynamicSectionPresentation" NOT NULL,
    "displayTitle" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvSectionMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CvSectionMapping_normalizedTitle_key" ON "CvSectionMapping"("normalizedTitle");
