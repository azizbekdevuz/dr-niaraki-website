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

import { getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { prisma } from '@/server/db/prisma';
import { ImportMergeError, mergeImportCandidateToWorkingDraft } from '@/server/imports/mergeImportToDraft';
import { getContentImportDetail, updateImportStatus } from '@/server/imports/repository';

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

  it('throws when merged import has no linked version row', async () => {
    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp',
      status: 'MERGED',
      candidatePayload: {},
      uploadedFile: { originalName: 'x.docx' },
      uploadedFileId: 'uf',
      versions: [],
    } as never);
    vi.mocked(prisma.contentVersion.findFirst).mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(mergeImportCandidateToWorkingDraft({ importId: 'imp', action: 'create' })).rejects.toBeInstanceOf(
      ImportMergeError,
    );
  });
});
