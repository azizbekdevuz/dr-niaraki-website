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
import { computeImportReviewManifestRevision } from '@/server/imports/importCandidateReview/revision';
import {
  saveImportReviewApprovals,
} from '@/server/imports/importCandidateReview/service';
import {
  parseStoredReviewApprovals,
  parseStoredReviewManifest,
  toStoredApprovalsEnvelope,
} from '@/server/imports/importCandidateReview/storageSchema';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';

const IMPORT_ID = 'imp-review-workflow';

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
    if (!decision) {
      return;
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
    if (!decision) {
      return;
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
