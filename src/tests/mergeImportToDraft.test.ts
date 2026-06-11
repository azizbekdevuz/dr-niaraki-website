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

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { prisma } from '@/server/db/prisma';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { CV_NARRATIVE_LIST_ITEM_PREFIX } from '@/server/imports/cvNarrativeToSimpleLists';
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
  });

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
    const envelope = buildImportCandidatePayload({
      rawDocumentText: 'body',
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp-remerge',
      status: 'MERGED',
      candidatePayload: envelope,
      uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
      createdAt: new Date(),
      versions: [],
    } as never);
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
    const envelope = buildImportCandidatePayload({
      rawDocumentText: raw,
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp-pat',
      status: 'PARSED',
      candidatePayload: envelope,
      uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
      createdAt: new Date(),
      versions: [],
    } as never);
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
    const envelope = buildImportCandidatePayload({
      rawDocumentText: raw,
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp-ack',
      status: 'PARSED',
      candidatePayload: envelope,
      uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
      createdAt: new Date(),
      versions: [],
    } as never);
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
    const envelope = buildImportCandidatePayload({
      rawDocumentText: 'cv body',
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp-nar',
      status: 'PARSED',
      candidatePayload: envelope,
      uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
      createdAt: new Date(),
      versions: [],
    } as never);
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
    const envelope = buildImportCandidatePayload({
      rawDocumentText: 'cv body',
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp-nar-fr',
      status: 'PARSED',
      candidatePayload: envelope,
      uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
      createdAt: new Date(),
      versions: [],
    } as never);
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
    const envelope = buildImportCandidatePayload({
      rawDocumentText: raw,
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp-fr',
      status: 'PARSED',
      candidatePayload: envelope,
      uploadedFile: { originalName: 't.docx', storedPath: '/u/t', id: 'uf1' },
      createdAt: new Date(),
      versions: [],
    } as never);
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
});
