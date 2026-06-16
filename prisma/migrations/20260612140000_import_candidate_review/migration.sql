-- Add candidate review manifest and approvals storage to ContentImport.
-- Rollback: ALTER TABLE "ContentImport" DROP COLUMN "reviewManifest", DROP COLUMN "reviewApprovals";

ALTER TABLE "ContentImport" ADD COLUMN "reviewManifest" JSONB;
ALTER TABLE "ContentImport" ADD COLUMN "reviewApprovals" JSONB;
