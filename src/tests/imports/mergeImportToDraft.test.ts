import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/imports/repository', () => ({
  getContentImportDetail: vi.fn(),
  updateImportStatus: vi.fn(),
}));

vi.mock('@/server/db/prisma', () => ({
  prisma: {
    contentVersion: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
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
  };
});

vi.mock('@/server/imports/importCandidateReview/service', () => ({
  ensureImportReviewManifest: vi.fn(),
}));

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { recordContentEvent } from '@/server/content/contentEvents';
import { getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { prisma } from '@/server/db/prisma';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { CV_NARRATIVE_LIST_ITEM_PREFIX } from '@/server/imports/cvNarrativeToSimpleLists';
import { generateImportReviewManifest } from '@/server/imports/importCandidateReview/generate';
import { ensureImportReviewManifest } from '@/server/imports/importCandidateReview/service';
import { toStoredApprovalsEnvelope } from '@/server/imports/importCandidateReview/storageSchema';
import { ImportMergeError, mergeImportCandidateToWorkingDraft } from '@/server/imports/mergeImportToDraft';
import { getContentImportDetail, updateImportStatus } from '@/server/imports/repository';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';

describe('mergeImportCandidateToWorkingDraft', () => {
  beforeEach(() => {
    vi.mocked(getContentImportDetail).mockReset();
    vi.mocked(updateImportStatus).mockReset();
    vi.mocked(prisma.contentVersion.create).mockReset();
    vi.mocked(prisma.contentVersion.update).mockReset();
    vi.mocked(prisma.contentVersion.findFirst).mockReset();
    vi.mocked(getWorkingDraft).mockReset();
    vi.mocked(ensureImportReviewManifest).mockReset();
  });

  async function attachReviewManifest<T extends Record<string, unknown>>(
    row: T,
    details: ReturnType<typeof minimalImportDetails>,
    importId: string,
    rawDocumentText = 'body',
    options?: { resolveBlocking?: boolean },
  ) {
    const envelope = buildImportCandidatePayload({
      rawDocumentText,
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    const { envelope: reviewEnvelope, manifest } = await generateImportReviewManifest({
      importId,
      sourceFileName: 't.docx',
      sourceTextHash: envelope.sourceTextHash,
      candidate: details,
    });
    const blockingApprovals = manifest.decisions
      .filter((d) => (d.action === 'manual-review' || d.action === 'remove-artifact') && d.section !== 'patents' && d.section !== 'research')
      .map((d) => ({ decisionId: d.decisionId, approvedAction: 'skip' as const }));
    const approvalsEnvelope =
      options?.resolveBlocking !== false && blockingApprovals.length > 0
        ? toStoredApprovalsEnvelope({
            manifestRevision: reviewEnvelope.manifestRevision,
            approvals: blockingApprovals,
          })
        : null;
    vi.mocked(ensureImportReviewManifest).mockResolvedValue(reviewEnvelope);
    return {
      ...row,
      candidatePayload: envelope,
      reviewManifest: reviewEnvelope,
      reviewApprovals: approvalsEnvelope,
    };
  }

  it('returns idempotent success when import already MERGED and a working draft exists', async () => {
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp',
      status: 'MERGED',
      candidatePayload: { profile: { name: 'Old' } },
      uploadedFile: { originalName: 'x.docx' },
      uploadedFileId: 'uf',
      versions: [],
    } as never);
    vi.mocked(prisma.contentVersion.findFirst).mockResolvedValueOnce({
      id: 'cv-working',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    const r = await mergeImportCandidateToWorkingDraft({ importId: 'imp', action: 'create' });
    expect(r.alreadyMerged).toBe(true);
    expect(r.version.id).toBe('cv-working');
    expect(prisma.contentVersion.create).not.toHaveBeenCalled();
  });

  it('throws INVALID_CANDIDATE when status is MERGED, no active draft, and payload is invalid', async () => {
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp',
      status: 'MERGED',
      candidatePayload: {},
      uploadedFile: { originalName: 'x.docx' },
      uploadedFileId: 'uf',
      versions: [],
    } as never);
    vi.mocked(prisma.contentVersion.findFirst).mockResolvedValueOnce(null);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);

    const err = await mergeImportCandidateToWorkingDraft({ importId: 'imp', action: 'create' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ImportMergeError);
    expect((err as ImportMergeError).code).toBe('INVALID_CANDIDATE');
  });

  it('re-merges successfully when status is MERGED but working draft was discarded', async () => {
    const details = minimalImportDetails({
      profile: { ...minimalImportDetails().profile, name: 'Re-merge Name' },
    });
    const row = await attachReviewManifest(
      {
        id: 'imp-remerge',
        status: 'MERGED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-remerge',
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(prisma.contentVersion.findFirst).mockResolvedValueOnce(null);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockResolvedValue({
      id: 'cv-remerge',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp-remerge',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    const r = await mergeImportCandidateToWorkingDraft({ importId: 'imp-remerge', action: 'create' });
    expect(r.alreadyMerged).toBe(false);
    expect(r.version.id).toBe('cv-remerge');
    expect(prisma.contentVersion.create).toHaveBeenCalled();
    expect(updateImportStatus).toHaveBeenCalledWith('imp-remerge', 'MERGED');
  });

  it('safe_update keeps canonical patent items when PATENT_COUNT_MISMATCH is present', async () => {
    const raw = 'Intro\nPatents (52 Registered & Completed)\nbody';
    const patents = Array.from({ length: 5 }, (_, i) => ({
      id: `pt-${i}`,
      title: `Patent ${i}`,
      inventors: null,
      number: null,
      country: null,
      date: null,
      status: 'registered' as const,
      type: 'international' as const,
      link: null,
      raw: null,
    }));
    const details = minimalImportDetails({
      profile: { ...minimalImportDetails().profile, name: 'Merge Test Name' },
      patents,
      counts: { publications: 0, patents: 5, projects: 0, awards: 0, students: 0 },
    });
    const row = await attachReviewManifest(
      {
        id: 'imp-pat',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-pat',
      raw,
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockResolvedValue({
      id: 'cv-new',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp-pat',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    await mergeImportCandidateToWorkingDraft({ importId: 'imp-pat', action: 'create' });

    const createArg = vi.mocked(prisma.contentVersion.create).mock.calls[0]?.[0];
    expect(createArg).toBeDefined();
    const validated = validateSiteContent(createArg!.data.payload);
    expect(validated.success).toBe(true);
    if (!validated.success) {
      return;
    }
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    expect(validated.data.patents.items).toEqual(baseline.patents.items);
    expect(validated.data.profile.displayName).toBe('Merge Test Name');
    expect(updateImportStatus).toHaveBeenCalledWith('imp-pat', 'MERGED');
  });

  it('rejects full_replace without acknowledgeHighRisk when safety requires acknowledgement', async () => {
    const raw = 'Patents (52 Registered & Completed)\nbody';
    const patents = Array.from({ length: 5 }, (_, i) => ({
      id: `pt-${i}`,
      title: `Patent ${i}`,
      inventors: null,
      number: null,
      country: null,
      date: null,
      status: 'registered' as const,
      type: 'international' as const,
      link: null,
      raw: null,
    }));
    const details = minimalImportDetails({ patents, counts: { publications: 0, patents: 5, projects: 0, awards: 0, students: 0 } });
    const row = await attachReviewManifest(
      {
        id: 'imp-ack',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-ack',
      raw,
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);

    await expect(
      mergeImportCandidateToWorkingDraft({
        importId: 'imp-ack',
        action: 'create',
        mergeMode: 'full_replace',
      }),
    ).rejects.toMatchObject({ code: 'MERGE_ACK_REQUIRED' });
    expect(prisma.contentVersion.create).not.toHaveBeenCalled();
  });

  it('safe_update preserves teaching/supervision/service when candidate has cv narrative imports', async () => {
    const details = minimalImportDetails({
      about: {
        ...minimalImportDetails().about,
        cvNarrativeSections: [
          {
            id: 'nar-teach-1',
            kind: 'teaching',
            sectionTitle: 'Teaching Experiences',
            body: 'Raw imported teaching narrative.',
            sourceSectionType: 'services',
          },
          {
            id: 'nar-lead-1',
            kind: 'leadership_supervision',
            sectionTitle: 'Supervision',
            body: 'Raw imported supervision narrative.',
            sourceSectionType: 'academic_narrative',
          },
          {
            id: 'nar-svc-1',
            kind: 'professional_services',
            sectionTitle: 'Professional Service',
            body: 'Raw imported service narrative.',
            sourceSectionType: 'services',
          },
        ],
      },
    });
    const row = await attachReviewManifest(
      {
        id: 'imp-nar',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-nar',
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockResolvedValue({
      id: 'cv-nar',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp-nar',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    await mergeImportCandidateToWorkingDraft({ importId: 'imp-nar', action: 'create' });

    const createArg = vi.mocked(prisma.contentVersion.create).mock.calls[0]?.[0];
    const validated = validateSiteContent(createArg!.data.payload);
    expect(validated.success).toBe(true);
    if (!validated.success) {
      return;
    }
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    expect(validated.data.teaching).toEqual(baseline.teaching);
    expect(validated.data.supervision).toEqual(baseline.supervision);
    expect(validated.data.service).toEqual(baseline.service);
  });

  it('full_replace with acknowledgement applies cv narrative rows to teaching/supervision/service', async () => {
    const details = minimalImportDetails({
      about: {
        ...minimalImportDetails().about,
        cvNarrativeSections: [
          {
            id: 'nar-teach-1',
            kind: 'teaching',
            sectionTitle: 'Teaching Experiences',
            body: 'Applied teaching narrative.',
            sourceSectionType: 'services',
          },
        ],
      },
    });
    const row = await attachReviewManifest(
      {
        id: 'imp-nar-fr',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-nar-fr',
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockResolvedValue({
      id: 'cv-nar-fr',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp-nar-fr',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    await mergeImportCandidateToWorkingDraft({
      importId: 'imp-nar-fr',
      action: 'create',
      mergeMode: 'full_replace',
      acknowledgeHighRisk: true,
    });

    const createArg = vi.mocked(prisma.contentVersion.create).mock.calls[0]?.[0];
    const validated = validateSiteContent(createArg!.data.payload);
    expect(validated.success).toBe(true);
    if (!validated.success) {
      return;
    }
    expect(
      validated.data.teaching.some((row) => row.id === `${CV_NARRATIVE_LIST_ITEM_PREFIX}nar-teach-1`),
    ).toBe(true);
    expect(validated.data.teaching[0]?.body).toContain('Applied teaching narrative');
  });

  it('allows full_replace when acknowledgeHighRisk is true', async () => {
    const raw = 'Patents (52 Registered & Completed)\nbody';
    const patents = Array.from({ length: 5 }, (_, i) => ({
      id: `pt-${i}`,
      title: `Patent ${i}`,
      inventors: null,
      number: null,
      country: null,
      date: null,
      status: 'registered' as const,
      type: 'international' as const,
      link: null,
      raw: null,
    }));
    const details = minimalImportDetails({ patents, counts: { publications: 0, patents: 5, projects: 0, awards: 0, students: 0 } });
    const row = await attachReviewManifest(
      {
        id: 'imp-fr',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-fr',
      raw,
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockResolvedValue({
      id: 'cv-fr',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp-fr',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    await mergeImportCandidateToWorkingDraft({
      importId: 'imp-fr',
      action: 'create',
      mergeMode: 'full_replace',
      acknowledgeHighRisk: true,
    });

    const createArg = vi.mocked(prisma.contentVersion.create).mock.calls[0]?.[0];
    expect(createArg).toBeDefined();
    const validated = validateSiteContent(createArg!.data.payload);
    expect(validated.success).toBe(true);
    if (validated.success) {
      expect(validated.data.patents.items).toHaveLength(5);
    }
  });

  it('rejects unresolved review override when reason is shorter than 8 characters', async () => {
    const details = minimalImportDetails();
    const row = await attachReviewManifest(
      {
        id: 'imp-short-reason',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-short-reason',
      'body',
      { resolveBlocking: false },
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);

    await expect(
      mergeImportCandidateToWorkingDraft({
        importId: 'imp-short-reason',
        action: 'create',
        acknowledgeUnresolvedReview: true,
        unresolvedReviewReason: 'short',
      }),
    ).rejects.toMatchObject({ code: 'MERGE_ACK_REQUIRED' });
    expect(prisma.contentVersion.create).not.toHaveBeenCalled();
  });

  it('does not record override audit event when merge fails after acknowledgement', async () => {
    vi.mocked(recordContentEvent).mockClear();
    const details = minimalImportDetails();
    const row = await attachReviewManifest(
      {
        id: 'imp-fail-merge',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-fail-merge',
      'body',
      { resolveBlocking: false },
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockRejectedValue(new Error('db failure'));

    await expect(
      mergeImportCandidateToWorkingDraft({
        importId: 'imp-fail-merge',
        action: 'create',
        acknowledgeUnresolvedReview: true,
        unresolvedReviewReason: 'Accepted risk for unresolved reconciliation decisions.',
      }),
    ).rejects.toThrow('db failure');

    const overrideEvents = vi
      .mocked(recordContentEvent)
      .mock.calls.filter(
        (call) =>
          (call[0] as { payload?: { kind?: string } }).payload?.kind ===
          'IMPORT_MERGE_UNRESOLVED_REVIEW_OVERRIDE',
      );
    expect(overrideEvents).toHaveLength(0);
  });

  it('records exactly one override audit event after successful acknowledged merge', async () => {
    vi.mocked(recordContentEvent).mockClear();
    const details = minimalImportDetails();
    const row = await attachReviewManifest(
      {
        id: 'imp-override-ok',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-override-ok',
      'body',
      { resolveBlocking: false },
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockResolvedValue({
      id: 'cv-override',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp-override-ok',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    await mergeImportCandidateToWorkingDraft({
      importId: 'imp-override-ok',
      action: 'create',
      acknowledgeUnresolvedReview: true,
      unresolvedReviewReason: '  Accepted risk for unresolved reconciliation decisions.  ',
    });

    const overrideEvents = vi
      .mocked(recordContentEvent)
      .mock.calls.filter(
        (call) =>
          (call[0] as { payload?: { kind?: string } }).payload?.kind ===
          'IMPORT_MERGE_UNRESOLVED_REVIEW_OVERRIDE',
      );
    expect(overrideEvents).toHaveLength(1);
    expect(overrideEvents[0]?.[0]).toMatchObject({
      versionId: 'cv-override',
      payload: expect.objectContaining({
        reason: 'Accepted risk for unresolved reconciliation decisions.',
      }),
    });
  });

  it('does not record override audit event when unresolved blocking count is zero', async () => {
    vi.mocked(recordContentEvent).mockClear();
    const details = minimalImportDetails();
    const row = await attachReviewManifest(
      {
        id: 'imp-no-override',
        status: 'PARSED',
        uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
        createdAt: new Date(),
        versions: [],
      },
      details,
      'imp-no-override',
    );
    vi.mocked(getContentImportDetail).mockResolvedValue(row as never);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(prisma.contentVersion.create).mockResolvedValue({
      id: 'cv-no-override',
      status: 'DRAFT',
      draftSlot: 'main',
      importId: 'imp-no-override',
      payload: {},
      label: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    await mergeImportCandidateToWorkingDraft({
      importId: 'imp-no-override',
      action: 'create',
      acknowledgeUnresolvedReview: true,
      unresolvedReviewReason: 'Should not be used when nothing is unresolved.',
    });

    const overrideEvents = vi
      .mocked(recordContentEvent)
      .mock.calls.filter(
        (call) =>
          (call[0] as { payload?: { kind?: string } }).payload?.kind ===
          'IMPORT_MERGE_UNRESOLVED_REVIEW_OVERRIDE',
      );
    expect(overrideEvents).toHaveLength(0);
  });
});
