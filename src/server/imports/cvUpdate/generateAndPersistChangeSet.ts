import 'server-only';

import type { SiteContent } from '@/content/schema';
import { prisma } from '@/server/db/prisma';
import {
  getDetailsFromCandidatePayload,
  parseImportCandidatePayload,
} from '@/server/imports/candidatePayload/schema';
import { getCurrentAcceptedCvBaseline } from '@/server/imports/cvUpdate/acceptedBaseline';
import { generateCvChangeSet } from '@/server/imports/cvUpdate/changeSetGenerate';
import type { GenerateCvChangeSetInput } from '@/server/imports/cvUpdate/changeSetGenerate';
import type {
  CvAcceptedBaselineRef,
  CvChangeSet,
  CvWebsiteRef,
} from '@/server/imports/cvUpdate/changeSetTypes';
import { listImportFieldLocks } from '@/server/imports/cvUpdate/fieldLocks';
import { withImportOperationTiming } from '@/server/imports/cvUpdate/instrumentation';
import { parseAcceptedCvNormalizedSnapshot } from '@/server/imports/cvUpdate/normalizeBaseline';
import { persistImportChangeSet } from '@/server/imports/cvUpdate/persistChangeSet';
import { listCvSectionMappings } from '@/server/imports/cvUpdate/sectionMappings';
import { resolveImportMergeReviewBaseline } from '@/server/imports/importCandidateReview/baseline';
import { ImportDomainError } from '@/server/imports/types';

async function resolveWebsiteForChangeSet(): Promise<{ website: SiteContent; websiteRef: CvWebsiteRef }> {
  const mergeBaseline = await resolveImportMergeReviewBaseline();
  let sourceType: CvWebsiteRef['sourceType'] = 'canonical';
  if (mergeBaseline.baselineRef.sourceType === 'published') {
    sourceType = 'published';
  } else if (mergeBaseline.baselineRef.sourceType === 'working_draft') {
    sourceType = 'working_draft';
  }
  return {
    website: mergeBaseline.baseline,
    websiteRef: {
      sourceType,
      versionId: mergeBaseline.baselineRef.versionId ?? null,
      label: mergeBaseline.baselineRef.label ?? null,
    },
  };
}

/**
 * Builds and persists the professor-facing change set for an import.
 * Reuses stored candidate payload — does not re-parse DOCX.
 */
export async function generateAndPersistImportChangeSet(importId: string): Promise<CvChangeSet> {
  return withImportOperationTiming(
    { importId, operation: 'change_set_generation' },
    async () => {
      const row = await prisma.contentImport.findUnique({ where: { id: importId } });
      if (!row) {
        throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
      }
      if (!row.candidatePayload) {
        throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import has no candidate payload.');
      }

      const details = getDetailsFromCandidatePayload(row.candidatePayload);
      const envelope = parseImportCandidatePayload(row.candidatePayload);
      if (!details) {
        throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import candidate is not valid Details JSON.');
      }

      const [baselineRow, fieldLocks, sectionMappings, websiteResolved] = await Promise.all([
        getCurrentAcceptedCvBaseline(),
        listImportFieldLocks(),
        listCvSectionMappings(),
        resolveWebsiteForChangeSet(),
      ]);

      const previousBaseline = baselineRow
        ? parseAcceptedCvNormalizedSnapshot(baselineRow.normalizedSnapshot)
        : null;

      const baselineRef: CvAcceptedBaselineRef | null = baselineRow
        ? {
            baselineId: baselineRow.id,
            sourceImportId: baselineRow.sourceImportId,
            acceptedAt: baselineRow.acceptedAt.toISOString(),
            parserVersion: baselineRow.parserVersion,
            mappingVersion: baselineRow.mappingVersion,
            sourceTextHash: baselineRow.sourceTextHash,
          }
        : null;

      const changeSet = generateCvChangeSet({
        importId,
        candidateDetails: details,
        candidateEnvelope: envelope as GenerateCvChangeSetInput['candidateEnvelope'],
        previousBaseline,
        website: websiteResolved.website,
        websiteRef: websiteResolved.websiteRef,
        fieldLocks: fieldLocks.map((lock) => ({
          fieldPath: lock.fieldPath,
          lockedWebsiteFingerprint: lock.lockedWebsiteFingerprint,
          rejectedSourceFingerprint: lock.rejectedSourceFingerprint,
        })),
        sectionMappings: sectionMappings.map((m) => ({
          normalizedTitle: m.normalizedTitle,
          presentation: m.presentation,
          displayTitle: m.displayTitle,
        })),
        baselineRef,
      });

      // Always invalidate prior decisions when regenerating comparison from stored candidate.
      await persistImportChangeSet(importId, changeSet, { invalidateDecisions: true });

      return changeSet;
    },
  );
}
