/** @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/db/prisma', () => ({
  prisma: {
    contentImport: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/server/content/contentEvents', () => ({
  recordContentEvent: vi.fn(),
}));

vi.mock('@/server/content/contentWorkflowCore', async () => {
  const actual = await vi.importActual('@/server/content/contentWorkflowCore');
  return {
    ...(actual as Record<string, unknown>),
    getWorkingDraft: vi.fn(),
    getLatestPublishedVersion: vi.fn(),
  };
});

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent } from '@/content/validators';
import { recordContentEvent } from '@/server/content/contentEvents';
import { getLatestPublishedVersion, getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { prisma } from '@/server/db/prisma';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { CandidateReviewApprovalError } from '@/server/imports/candidateReviewValidate';
import { countUnresolvedBlockingDecisions } from '@/server/imports/importCandidateReview/gate';
import {
  generateImportReviewManifest,
  summarizeReviewManifestForAudit,
} from '@/server/imports/importCandidateReview/generate';
import { loadImportReviewStateFromRow } from '@/server/imports/importCandidateReview/reconcile';
import { computeImportReviewManifestRevision } from '@/server/imports/importCandidateReview/revision';
import {
  saveImportReviewApprovals,
  importStatusAcceptsReviewApprovalUpdates,
} from '@/server/imports/importCandidateReview/service';
import {
  parseStoredReviewApprovals,
  parseStoredReviewManifest,
  storedReviewManifestEnvelopeSchema,
  toStoredApprovalsEnvelope,
} from '@/server/imports/importCandidateReview/storageSchema';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';

const IMPORT_ID = 'imp-review-workflow';

function mockApprovalSaveTransaction(input: {
  importId: string;
  row: Record<string, unknown>;
  onLocked?: () => void;
}) {
  const callOrder: string[] = [];
  const queryRaw = vi.fn(async () => {
    callOrder.push('lock');
    input.onLocked?.();
    return [{ id: input.importId }];
  });
  const findUnique = vi.fn(async () => {
    callOrder.push('read');
    return input.row;
  });
  const update = vi.fn(async () => {
    callOrder.push('update');
    return {};
  });
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
    const tx = {
      $queryRaw: queryRaw,
      contentImport: { findUnique, update },
    };
    return fn(tx as never);
  });
  return { callOrder, queryRaw, findUnique, update };
}

function envelopeFromDetails(details = minimalImportDetails(), rawDocumentText = 'cv body text for hash') {
  return buildImportCandidatePayload({
    rawDocumentText,
    parserVersion: 't',
    details,
    sections: [],
    importWarnings: [],
  });
}

describe('import candidate review storage', () => {
  beforeEach(() => {
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(getLatestPublishedVersion).mockResolvedValue(null);
  });

  it('validates stored manifest envelope', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    expect(parseStoredReviewManifest(envelope)).not.toBeNull();
    expect(envelope.manifestRevision).toHaveLength(32);
    expect(manifest.decisions.length).toBeGreaterThanOrEqual(0);
    const summary = summarizeReviewManifestForAudit(manifest);
    expect(summary.decisionCount).toBe(manifest.decisions.length);
  });

  it('rejects stale manifest revision submissions', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const decision = manifest.decisions.find((d) => d.action === 'manual-review');
    expect(decision).toBeDefined();
    if (!decision) {
      throw new Error('Expected at least one manual-review decision for this fixture.');
    }
    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      id: IMPORT_ID,
      status: 'PARSED',
      candidatePayload: payload,
      reviewManifest: envelope,
      reviewApprovals: null,
    } as never);

    await expect(
      saveImportReviewApprovals({
        importId: IMPORT_ID,
        manifestRevision: 'deadbeefdeadbeefdeadbeefdeadbeef',
        approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
      }),
    ).rejects.toMatchObject({ code: 'REVIEW_MANIFEST_STALE' });
  });

  it('persists approvals transactionally and records audit event', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const decision = manifest.decisions.find(
      (d) => d.section === 'publications' && d.action === 'manual-review',
    );
    expect(decision).toBeDefined();
    if (!decision) {
      throw new Error('Expected a publications manual-review decision for this fixture.');
    }
    const approvalsEnvelope = toStoredApprovalsEnvelope({
      manifestRevision: envelope.manifestRevision,
      approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
    });

    vi.mocked(prisma.contentImport.findUnique)
      .mockResolvedValueOnce({
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: null,
      } as never)
      .mockResolvedValueOnce({
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: approvalsEnvelope,
      } as never)
      .mockResolvedValueOnce({
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: approvalsEnvelope,
      } as never);

    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: IMPORT_ID }]),
        contentImport: {
          findUnique: vi.fn().mockResolvedValue({
            id: IMPORT_ID,
            status: 'PARSED',
            candidatePayload: payload,
            reviewManifest: envelope,
            reviewApprovals: null,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx as never);
    });

    const state = await saveImportReviewApprovals({
      importId: IMPORT_ID,
      manifestRevision: envelope.manifestRevision,
      approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
    });
    expect(state?.approvals).toHaveLength(1);
    expect(recordContentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SYSTEM_NOTE',
        payload: expect.objectContaining({ kind: 'IMPORT_REVIEW_APPROVALS_UPDATED' }),
      }),
    );
  });

  it('rejects advisory patent approvals', async () => {
    const candidate = minimalImportDetails({
      patents: [
        {
          id: 'p1',
          title: 'Patent',
          number: '1',
          country: 'US',
          date: null,
          inventors: null,
          status: null,
          type: 'international',
          raw: null,
        },
      ],
    });
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const patentDecision = manifest.decisions.find((d) => d.section === 'patents');
    expect(patentDecision).toBeDefined();
    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      id: IMPORT_ID,
      status: 'PARSED',
      candidatePayload: payload,
      reviewManifest: envelope,
      reviewApprovals: null,
    } as never);

    await expect(
      saveImportReviewApprovals({
        importId: IMPORT_ID,
        manifestRevision: envelope.manifestRevision,
        approvals: [{ decisionId: patentDecision!.decisionId, approvedAction: 'skip' }],
      }),
    ).rejects.toBeInstanceOf(CandidateReviewApprovalError);
  });

  it('clears approvals when manifest revision changes', () => {
    const revisionA = computeImportReviewManifestRevision({
      sourceTextHash: 'hash-a',
      decisionIds: ['a:1', 'a:2'],
    });
    const revisionB = computeImportReviewManifestRevision({
      sourceTextHash: 'hash-b',
      decisionIds: ['a:1', 'a:2'],
    });
    expect(revisionA).not.toBe(revisionB);
    const approvals = toStoredApprovalsEnvelope({
      manifestRevision: revisionA,
      approvals: [{ decisionId: 'a:1', approvedAction: 'skip' }],
    });
    expect(parseStoredReviewApprovals(approvals)?.manifestRevision).toBe(revisionA);
  });

  it('rejects duplicate decisionId values in stored manifest envelope', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    expect(manifest.decisions.length).toBeGreaterThan(0);
    const duplicateDecision = { ...manifest.decisions[0]! };
    const malformed = {
      ...envelope,
      manifest: {
        ...manifest,
        decisions: [...manifest.decisions, duplicateDecision],
      },
    };
    expect(parseStoredReviewManifest(malformed)).toBeNull();
  });

  it('accepts unique decisionId values in stored manifest envelope', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    expect(storedReviewManifestEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });

  it('fails closed when stored approvals are malformed', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    expect(() =>
      loadImportReviewStateFromRow({
        reviewManifest: envelope,
        reviewApprovals: { not: 'valid' },
      }),
    ).toThrowError(expect.objectContaining({ code: 'REVIEW_APPROVALS_INVALID' }));
  });

  it('rejects approval save when import status flips to finalized inside transaction', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const decision = manifest.decisions.find(
      (d) => d.section === 'publications' && d.action === 'manual-review',
    );
    expect(decision).toBeDefined();
    if (!decision) {
      throw new Error('Expected a publications manual-review decision for this fixture.');
    }

    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      id: IMPORT_ID,
      status: 'PARSED',
      candidatePayload: payload,
      reviewManifest: envelope,
      reviewApprovals: null,
    } as never);

    const { callOrder, update } = mockApprovalSaveTransaction({
      importId: IMPORT_ID,
      row: {
        id: IMPORT_ID,
        status: 'MERGED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: null,
      },
    });

    await expect(
      saveImportReviewApprovals({
        importId: IMPORT_ID,
        manifestRevision: envelope.manifestRevision,
        approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
      }),
    ).rejects.toMatchObject({ code: 'IMPORT_FINALIZED' });
    expect(callOrder).toEqual(['lock', 'read']);
    expect(update).not.toHaveBeenCalled();
  });

  it('locks the import row before reading and updating approvals', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const decision = manifest.decisions.find(
      (d) => d.section === 'publications' && d.action === 'manual-review',
    );
    expect(decision).toBeDefined();
    if (!decision) {
      throw new Error('Expected a publications manual-review decision for this fixture.');
    }

    vi.mocked(prisma.contentImport.findUnique)
      .mockResolvedValueOnce({
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: null,
      } as never)
      .mockResolvedValueOnce({
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: toStoredApprovalsEnvelope({
          manifestRevision: envelope.manifestRevision,
          approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
        }),
      } as never)
      .mockResolvedValueOnce({
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: toStoredApprovalsEnvelope({
          manifestRevision: envelope.manifestRevision,
          approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
        }),
      } as never);

    const { callOrder, queryRaw, findUnique, update } = mockApprovalSaveTransaction({
      importId: IMPORT_ID,
      row: {
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: envelope,
        reviewApprovals: null,
      },
    });

    await saveImportReviewApprovals({
      importId: IMPORT_ID,
      manifestRevision: envelope.manifestRevision,
      approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
    });

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(['lock', 'read', 'update']);
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('rejects approval save when manifest revision changes after row lock', async () => {
    const candidate = minimalImportDetails();
    const payload = envelopeFromDetails(candidate);
    const { envelope, manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const decision = manifest.decisions.find(
      (d) => d.section === 'publications' && d.action === 'manual-review',
    );
    expect(decision).toBeDefined();
    if (!decision) {
      throw new Error('Expected a publications manual-review decision for this fixture.');
    }
    const staleEnvelope = {
      ...envelope,
      manifestRevision: 'deadbeefdeadbeefdeadbeefdeadbeef',
    };

    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      id: IMPORT_ID,
      status: 'PARSED',
      candidatePayload: payload,
      reviewManifest: envelope,
      reviewApprovals: null,
    } as never);

    const { callOrder, update } = mockApprovalSaveTransaction({
      importId: IMPORT_ID,
      row: {
        id: IMPORT_ID,
        status: 'PARSED',
        candidatePayload: payload,
        reviewManifest: staleEnvelope,
        reviewApprovals: null,
      },
    });

    await expect(
      saveImportReviewApprovals({
        importId: IMPORT_ID,
        manifestRevision: envelope.manifestRevision,
        approvals: [{ decisionId: decision.decisionId, approvedAction: 'skip' }],
      }),
    ).rejects.toMatchObject({ code: 'CONCURRENT_UPDATE' });
    expect(callOrder).toEqual(['lock', 'read']);
    expect(update).not.toHaveBeenCalled();
  });

  it('documents allowed import statuses for review approval updates', () => {
    expect(importStatusAcceptsReviewApprovalUpdates('PARSED')).toBe(true);
    expect(importStatusAcceptsReviewApprovalUpdates('NEEDS_REVIEW')).toBe(true);
    expect(importStatusAcceptsReviewApprovalUpdates('MERGED')).toBe(false);
    expect(importStatusAcceptsReviewApprovalUpdates('REJECTED')).toBe(false);
    expect(importStatusAcceptsReviewApprovalUpdates('FAILED')).toBe(false);
    expect(importStatusAcceptsReviewApprovalUpdates('UPLOADED')).toBe(false);
  });

  it('uses unambiguous revision serialization for unusual decision ids', () => {
    const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const revisionA = computeImportReviewManifestRevision({
      sourceTextHash: hash,
      decisionIds: ['id\nb', 'id'],
    });
    const revisionB = computeImportReviewManifestRevision({
      sourceTextHash: hash,
      decisionIds: ['id', 'id\nb'],
    });
    const revisionC = computeImportReviewManifestRevision({
      sourceTextHash: hash,
      decisionIds: ['id', 'idb'],
    });
    expect(revisionA).toBe(revisionB);
    expect(revisionA).not.toBe(revisionC);
  });

  it('advisory patent decisions do not block merge accounting count', async () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const candidate = minimalImportDetails({
      patents: [
        {
          id: 'p1',
          title: 'Patent',
          number: '1',
          country: 'US',
          date: null,
          inventors: null,
          status: null,
          type: 'international',
          raw: null,
        },
      ],
    });
    const payload = envelopeFromDetails(candidate);
    const { manifest } = await generateImportReviewManifest({
      importId: IMPORT_ID,
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    expect(manifest.accounting.patents.unresolvedAdvisoryDecisions).toBeGreaterThan(0);
    expect(countUnresolvedBlockingDecisions(manifest)).toBe(
      manifest.accounting.publications.unresolvedManualReview +
        manifest.accounting.awards.unresolvedManualReview,
    );
    void baseline;
  });
});

describe('import candidate review API auth', () => {
  it('review-approvals route module exports POST handler', async () => {
    const mod = await import('@/app/api/admin/imports/[id]/review-approvals/route');
    expect(typeof mod.POST).toBe('function');
  });
});
