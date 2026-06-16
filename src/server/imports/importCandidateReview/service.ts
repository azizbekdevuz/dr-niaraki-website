import 'server-only';

import { Prisma } from '@prisma/client';

import { recordContentEvent } from '@/server/content/contentEvents';
import { prisma } from '@/server/db/prisma';
import { getDetailsFromCandidatePayload, parseImportCandidatePayload } from '@/server/imports/candidatePayload/schema';
import { withAppliedAccounting } from '@/server/imports/candidateReviewAccounting';
import type { CandidateReviewApproval } from '@/server/imports/candidateReviewManifest';
import { validateCandidateReviewApprovals } from '@/server/imports/candidateReviewValidate';
import { resolveImportMergeReviewBaseline } from '@/server/imports/importCandidateReview/baseline';
import { countUnresolvedBlockingDecisions } from '@/server/imports/importCandidateReview/gate';
import {
  generateImportReviewManifest,
  recordImportReviewGeneratedEvent,
  summarizeReviewManifestForAudit,
} from '@/server/imports/importCandidateReview/generate';
import {
  loadImportReviewStateFromRow,
  verifyReviewApprovalsRevision,
  verifyReviewManifestSourceHash,
  ImportReviewReconcileError,
} from '@/server/imports/importCandidateReview/reconcile';
import { buildImportCandidateReviewStateDto } from '@/server/imports/importCandidateReview/state';
import {
  toStoredApprovalsEnvelope,
  type StoredReviewManifestEnvelope,
} from '@/server/imports/importCandidateReview/storageSchema';
import { ImportDomainError } from '@/server/imports/types';

export class ImportReviewApprovalPersistError extends Error {
  constructor(
    readonly code:
      | 'IMPORT_NOT_FOUND'
      | 'IMPORT_FINALIZED'
      | 'REVIEW_MANIFEST_MISSING'
      | 'REVIEW_MANIFEST_STALE'
      | 'REVIEW_APPROVALS_INVALID'
      | 'CONCURRENT_UPDATE',
    message: string,
  ) {
    super(message);
    this.name = 'ImportReviewApprovalPersistError';
  }
}

export async function persistImportReviewManifest(
  importId: string,
  envelope: StoredReviewManifestEnvelope,
  options?: { clearApprovals?: boolean },
): Promise<void> {
  try {
    await prisma.contentImport.update({
      where: { id: importId },
      data: {
        reviewManifest: envelope as unknown as Prisma.InputJsonValue,
        ...(options?.clearApprovals ? { reviewApprovals: Prisma.DbNull } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
    }
    throw e;
  }
}

export async function generateAndPersistImportReviewManifest(importId: string): Promise<{
  envelope: StoredReviewManifestEnvelope;
}> {
  const row = await prisma.contentImport.findUnique({ where: { id: importId } });
  if (!row) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
  }
  const envelopePayload = parseImportCandidatePayload(row.candidatePayload);
  const details = getDetailsFromCandidatePayload(row.candidatePayload);
  if (!envelopePayload || !details) {
    throw new ImportReviewReconcileError('REVIEW_MANIFEST_MISSING', 'Import has no candidate payload.');
  }

  const prior = loadImportReviewStateFromRow(row);
  const { envelope, manifest } = await generateImportReviewManifest({
    importId,
    sourceFileName: details.meta?.sourceFileName ?? 'unknown',
    sourceTextHash: envelopePayload.sourceTextHash,
    candidate: details,
  });

  const clearApprovals =
    !prior ||
    prior.manifestEnvelope.manifestRevision !== envelope.manifestRevision ||
    prior.manifestEnvelope.sourceTextHash !== envelope.sourceTextHash;

  await persistImportReviewManifest(importId, envelope, { clearApprovals });

  const summary = summarizeReviewManifestForAudit(manifest);
  await recordImportReviewGeneratedEvent({
    importId,
    manifestRevision: envelope.manifestRevision,
    baselineRef: manifest.baseline,
    summary,
  });

  return { envelope };
}

export async function getImportCandidateReviewState(importId: string) {
  const row = await prisma.contentImport.findUnique({ where: { id: importId } });
  if (!row) {
    return null;
  }
  const loaded = loadImportReviewStateFromRow(row);
  if (!loaded) {
    return buildImportCandidateReviewStateDto({
      manifestEnvelope: null,
      manifest: null,
      approvalsEnvelope: null,
      approvals: [],
      unresolvedBlockingCount: 0,
    });
  }
  return buildImportCandidateReviewStateDto({
    manifestEnvelope: loaded.manifestEnvelope,
    manifest: loaded.manifest,
    approvalsEnvelope: loaded.approvalsEnvelope,
    approvals: loaded.approvals,
    unresolvedBlockingCount: countUnresolvedBlockingDecisions(loaded.manifest),
  });
}

export async function saveImportReviewApprovals(input: {
  importId: string;
  manifestRevision: string;
  approvals: readonly CandidateReviewApproval[];
}): Promise<ReturnType<typeof getImportCandidateReviewState>> {
  const row = await prisma.contentImport.findUnique({ where: { id: input.importId } });
  if (!row) {
    throw new ImportReviewApprovalPersistError('IMPORT_NOT_FOUND', 'Import not found.');
  }
  if (row.status === 'REJECTED' || row.status === 'FAILED') {
    throw new ImportReviewApprovalPersistError(
      'IMPORT_FINALIZED',
      `Import status "${row.status}" does not accept review approval updates.`,
    );
  }

  const loaded = loadImportReviewStateFromRow(row);
  if (!loaded) {
    throw new ImportReviewApprovalPersistError('REVIEW_MANIFEST_MISSING', 'Import has no review manifest.');
  }

  const { baseline } = await resolveImportMergeReviewBaseline();
  validateCandidateReviewApprovals(loaded.manifestEnvelope.manifest, baseline, input.approvals);

  if (loaded.manifestEnvelope.manifestRevision !== input.manifestRevision) {
    throw new ImportReviewApprovalPersistError(
      'REVIEW_MANIFEST_STALE',
      'Submitted manifest revision does not match the current import review manifest.',
    );
  }

  const envelopePayload = parseImportCandidatePayload(row.candidatePayload);
  if (envelopePayload) {
    verifyReviewManifestSourceHash(loaded.manifestEnvelope, envelopePayload.sourceTextHash);
  }

  const applied = withAppliedAccounting(loaded.manifestEnvelope.manifest, input.approvals);
  const approvalsEnvelope = toStoredApprovalsEnvelope({
    manifestRevision: input.manifestRevision,
    approvals: input.approvals,
  });

  await prisma.$transaction(async (tx) => {
    const current = await tx.contentImport.findUnique({ where: { id: input.importId } });
    if (!current) {
      throw new ImportReviewApprovalPersistError('IMPORT_NOT_FOUND', 'Import not found.');
    }
    const currentLoaded = loadImportReviewStateFromRow(current);
    if (!currentLoaded) {
      throw new ImportReviewApprovalPersistError('REVIEW_MANIFEST_MISSING', 'Import has no review manifest.');
    }
    if (currentLoaded.manifestEnvelope.manifestRevision !== input.manifestRevision) {
      throw new ImportReviewApprovalPersistError(
        'CONCURRENT_UPDATE',
        'Review manifest changed during approval save. Reload and try again.',
      );
    }

    await tx.contentImport.update({
      where: { id: input.importId },
      data: {
        reviewApprovals: approvalsEnvelope as unknown as Prisma.InputJsonValue,
      },
    });
  });

  await recordContentEvent({
    eventType: 'SYSTEM_NOTE',
    payload: {
      kind: 'IMPORT_REVIEW_APPROVALS_UPDATED',
      importId: input.importId,
      manifestRevision: input.manifestRevision,
      approvalCount: input.approvals.length,
      approvals: input.approvals.map((a) => ({
        decisionId: a.decisionId,
        approvedAction: a.approvedAction,
        selectedExistingId: a.selectedExistingId ?? null,
      })),
      unresolvedBlockingCount: countUnresolvedBlockingDecisions(applied),
    },
  });

  return getImportCandidateReviewState(input.importId);
}

export async function ensureImportReviewManifest(importId: string): Promise<StoredReviewManifestEnvelope> {
  const row = await prisma.contentImport.findUnique({ where: { id: importId } });
  if (!row) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
  }
  const loaded = loadImportReviewStateFromRow(row);
  if (loaded) {
    const envelopePayload = parseImportCandidatePayload(row.candidatePayload);
    if (envelopePayload) {
      verifyReviewManifestSourceHash(loaded.manifestEnvelope, envelopePayload.sourceTextHash);
      if (loaded.approvalsEnvelope) {
        verifyReviewApprovalsRevision(loaded.manifestEnvelope, loaded.approvalsEnvelope);
      }
    }
    return loaded.manifestEnvelope;
  }
  const { envelope } = await generateAndPersistImportReviewManifest(importId);
  return envelope;
}
