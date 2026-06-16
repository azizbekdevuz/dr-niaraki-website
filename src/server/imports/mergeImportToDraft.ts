import 'server-only';

import type { ContentVersion, Prisma } from '@prisma/client';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { validateSiteContent } from '@/content/validators';
import { recordContentEvent } from '@/server/content/contentEvents';
import {
  ContentWorkflowError,
  WORKING_DRAFT_SLOT,
  getWorkingDraft,
} from '@/server/content/contentWorkflowCore';
import { prisma } from '@/server/db/prisma';
import { buildImportMergeSafetyReport } from '@/server/imports/buildImportMergeSafetyReport';
import { getDetailsFromCandidatePayload, parseImportCandidatePayload } from '@/server/imports/candidatePayload/schema';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import {
  ImportReviewReconcileError,
  loadImportReviewStateFromRow,
  reconcileCandidateForMerge,
  verifyReviewManifestSourceHash,
} from '@/server/imports/importCandidateReview/reconcile';
import {
  ensureImportReviewManifest,
} from '@/server/imports/importCandidateReview/service';
import { freezeKeysFromSafetyReport } from '@/server/imports/importMergeSectionSafety';
import { type ImportReviewProvenance } from '@/server/imports/importReviewStructured';
import { getContentImportDetail, updateImportStatus } from '@/server/imports/repository';

function toJsonPayload(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

export class ImportMergeError extends Error {
  constructor(
    readonly code:
      | 'IMPORT_NOT_FOUND'
      | 'NO_CANDIDATE'
      | 'INVALID_CANDIDATE'
      | 'MERGE_VALIDATION_FAILED'
      | 'MERGE_ACK_REQUIRED'
      | 'REVIEW_BLOCKED'
      | 'REVIEW_MANIFEST_MISSING'
      | 'REVIEW_MANIFEST_STALE'
      | 'REVIEW_APPROVALS_STALE',
    message: string,
  ) {
    super(message);
    this.name = 'ImportMergeError';
  }
}

type ImportDetailRow = NonNullable<Awaited<ReturnType<typeof getContentImportDetail>>>;

async function loadDetailsFromImportRow(row: ImportDetailRow) {
  if (row.status === 'FAILED' || !row.candidatePayload) {
    throw new ImportMergeError('NO_CANDIDATE', 'This import has no mergeable candidate payload.');
  }
  if (row.status === 'REJECTED') {
    throw new ImportMergeError('NO_CANDIDATE', 'This import was already finalized and cannot merge again.');
  }
  const parsed = getDetailsFromCandidatePayload(row.candidatePayload);
  if (!parsed) {
    throw new ImportMergeError('INVALID_CANDIDATE', 'Stored candidate is not valid Details JSON.');
  }
  return { importRow: row, details: parsed };
}

export type MergeImportCandidateResult = {
  version: ContentVersion;
  alreadyMerged: boolean;
};

/**
 * Creates a working draft from the import candidate, or replaces the existing draft payload.
 * Never touches published rows. Sets `ContentVersion.importId` and marks the import `MERGED`.
 */
export async function mergeImportCandidateToWorkingDraft(input: {
  importId: string;
  action: 'create' | 'replace';
  /** Default `safe_update` freezes high-risk list sections; `full_replace` maps the full import. */
  mergeMode?: 'safe_update' | 'full_replace';
  /** Required when `mergeMode` is `full_replace` and the import has any non-safe section. */
  acknowledgeHighRisk?: boolean;
  /** Required when unresolved publication/award reconciliation decisions remain. */
  acknowledgeUnresolvedReview?: boolean;
  unresolvedReviewReason?: string | null;
  changeSummary?: string | null;
}): Promise<MergeImportCandidateResult> {
  const quick = await getContentImportDetail(input.importId);
  if (!quick) {
    throw new ImportMergeError('IMPORT_NOT_FOUND', 'Import not found.');
  }

  if (quick.status === 'MERGED') {
    const working = await prisma.contentVersion.findFirst({
      where: { importId: input.importId, draftSlot: WORKING_DRAFT_SLOT, status: 'DRAFT' },
    });
    if (working) {
      return { version: working, alreadyMerged: true };
    }
    // Draft was discarded (or replaced by a different import) — fall through to re-merge.
  }

  const { importRow, details: rawDetails } = await loadDetailsFromImportRow(quick);
  const baselineParsed = validateSiteContent(SITE_CONTENT_RAW);
  if (!baselineParsed.success) {
    throw new ImportMergeError('MERGE_VALIDATION_FAILED', 'Canonical baseline failed validation.');
  }
  const working = await getWorkingDraft();
  const basePayload = working ? validateSiteContent(working.payload) : baselineParsed;
  if (!basePayload.success) {
    throw new ImportMergeError('MERGE_VALIDATION_FAILED', 'Working draft payload is invalid.');
  }
  const baselineData = basePayload.data;

  const manifestEnvelope = await ensureImportReviewManifest(input.importId);
  const reviewRow = await getContentImportDetail(input.importId);
  const loadedReview = reviewRow
    ? loadImportReviewStateFromRow({
        reviewManifest: reviewRow.reviewManifest,
        reviewApprovals: reviewRow.reviewApprovals,
        candidatePayload: reviewRow.candidatePayload,
      })
    : null;
  if (!loadedReview) {
    throw new ImportMergeError('REVIEW_MANIFEST_MISSING', 'Import has no reconciliation review manifest.');
  }
  const envelopePayload = parseImportCandidatePayload(importRow.candidatePayload);
  if (envelopePayload) {
    try {
      verifyReviewManifestSourceHash(manifestEnvelope, envelopePayload.sourceTextHash);
    } catch (e) {
      if (e instanceof ImportReviewReconcileError) {
        throw new ImportMergeError('REVIEW_MANIFEST_STALE', e.message);
      }
      throw e;
    }
  }

  let reconciledDetails = rawDetails;
  let reconciledAccounting: Prisma.InputJsonValue | null = null;
  let unresolvedBlockingCount = 0;
  try {
    const reconciled = await reconcileCandidateForMerge({
      candidate: rawDetails,
      baseline: baselineData,
      manifestEnvelope: loadedReview.manifestEnvelope,
      manifest: loadedReview.manifestEnvelope.manifest,
      approvals: loadedReview.approvals,
      acknowledgeUnresolvedReview: input.acknowledgeUnresolvedReview,
      unresolvedReviewReason: input.unresolvedReviewReason,
    });
    reconciledDetails = reconciled.details;
    reconciledAccounting = JSON.parse(JSON.stringify(reconciled.manifest.accounting)) as Prisma.InputJsonValue;
    unresolvedBlockingCount = reconciled.unresolvedBlockingCount;
  } catch (e) {
    if (e instanceof ImportReviewReconcileError) {
      if (e.code === 'REVIEW_BLOCKED') {
        throw new ImportMergeError('REVIEW_BLOCKED', e.message);
      }
      if (e.code === 'REVIEW_MANIFEST_STALE' || e.code === 'REVIEW_APPROVALS_STALE') {
        throw new ImportMergeError(e.code, e.message);
      }
    }
    throw e;
  }

  if (
    input.acknowledgeUnresolvedReview &&
    unresolvedBlockingCount > 0 &&
    !input.unresolvedReviewReason?.trim()
  ) {
    throw new ImportMergeError(
      'MERGE_ACK_REQUIRED',
      'Unresolved reconciliation override requires unresolvedReviewReason.',
    );
  }

  if (input.acknowledgeUnresolvedReview && unresolvedBlockingCount > 0) {
    await recordContentEvent({
      eventType: 'SYSTEM_NOTE',
      payload: {
        kind: 'IMPORT_MERGE_UNRESOLVED_REVIEW_OVERRIDE',
        importId: input.importId,
        unresolvedBlockingCount,
        reason: input.unresolvedReviewReason?.trim() ?? null,
      },
    });
  }

  const provenance: ImportReviewProvenance = {
    importId: importRow.id,
    originalFileName: importRow.uploadedFile.originalName,
    storedPath: importRow.uploadedFile.storedPath,
    uploadedFileId: importRow.uploadedFile.id,
  };

  const { mergeSafety: safety } = buildImportMergeSafetyReport({
    details: reconciledDetails,
    mergeBaseline: baselineData,
    candidatePayload: importRow.candidatePayload,
    provenance,
  });

  const mergeMode = input.mergeMode ?? 'safe_update';
  if (mergeMode === 'full_replace' && safety.fullReplaceRequiresAck && !input.acknowledgeHighRisk) {
    throw new ImportMergeError(
      'MERGE_ACK_REQUIRED',
      'Full replace requires acknowledgeHighRisk: true because this import has high-churn or review-only sections.',
    );
  }

  const merged =
    mergeMode === 'full_replace'
      ? mergeCvDetailsIntoSiteContent(reconciledDetails, baselineData)
      : mergeCvDetailsIntoSiteContent(reconciledDetails, baselineData, {
          freeze: freezeKeysFromSafetyReport(safety),
        });

  const validated = validateSiteContent(merged);
  if (!validated.success) {
    throw new ImportMergeError(
      'MERGE_VALIDATION_FAILED',
      `Merged SiteContent failed validation: ${validated.error.message}`,
    );
  }

  if (input.action === 'create') {
    if (working) {
      throw new ContentWorkflowError(
        'DRAFT_EXISTS',
        'A working draft already exists. Use replace, or publish/discard the draft first.',
      );
    }
    const row = await prisma.contentVersion.create({
      data: {
        status: 'DRAFT',
        draftSlot: WORKING_DRAFT_SLOT,
        importId: input.importId,
        payload: toJsonPayload(validated.data),
        label: `Draft from import ${input.importId.slice(0, 8)}…`,
        changeSummary: input.changeSummary ?? `Merged from import ${importRow.uploadedFile.originalName}`,
        createdBy: null,
      },
    });
    await recordContentEvent({
      eventType: 'WORKING_DRAFT_CREATED',
      versionId: row.id,
      payload: {
        importId: input.importId,
        source: 'import_candidate',
        reconciledAccounting,
        unresolvedBlockingCount,
        acknowledgedUnresolvedReview: Boolean(input.acknowledgeUnresolvedReview),
      },
    });
    await recordContentEvent({
      eventType: 'SYSTEM_NOTE',
      versionId: row.id,
      payload: {
        kind: 'IMPORT_MERGED_TO_WORKING_DRAFT',
        importId: input.importId,
        action: 'create',
        reconciledAccounting,
        unresolvedBlockingCount,
        acknowledgedUnresolvedReview: Boolean(input.acknowledgeUnresolvedReview),
        unresolvedReviewReason: input.unresolvedReviewReason ?? null,
      },
    });
    await updateImportStatus(input.importId, 'MERGED');
    return { version: row, alreadyMerged: false };
  }

  if (!working) {
    throw new ContentWorkflowError('NO_DRAFT', 'No working draft to replace.');
  }
  const row = await prisma.contentVersion.update({
    where: { id: working.id },
    data: {
      payload: toJsonPayload(validated.data),
      importId: input.importId,
      changeSummary: input.changeSummary ?? working.changeSummary,
    },
  });
  await recordContentEvent({
    eventType: 'WORKING_DRAFT_UPDATED',
    versionId: row.id,
    payload: {
      importId: input.importId,
      source: 'import_candidate_replace',
      reconciledAccounting,
      unresolvedBlockingCount,
      acknowledgedUnresolvedReview: Boolean(input.acknowledgeUnresolvedReview),
    },
  });
  await recordContentEvent({
    eventType: 'SYSTEM_NOTE',
    versionId: row.id,
    payload: {
      kind: 'IMPORT_MERGED_TO_WORKING_DRAFT',
      importId: input.importId,
      action: 'replace',
      reconciledAccounting,
      unresolvedBlockingCount,
      acknowledgedUnresolvedReview: Boolean(input.acknowledgeUnresolvedReview),
      unresolvedReviewReason: input.unresolvedReviewReason ?? null,
    },
  });
  await updateImportStatus(input.importId, 'MERGED');
  return { version: row, alreadyMerged: false };
}
