import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/db/prisma', () => ({
  prisma: {
    contentImport: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/server/content/contentEvents', () => ({
  recordContentEvent: vi.fn(),
}));

import { recordContentEvent } from '@/server/content/contentEvents';
import { prisma } from '@/server/db/prisma';
import type { CvChangeSet } from '@/server/imports/cvUpdate/changeSetTypes';
import {
  persistImportChangeDecisions,
  persistImportChangeSet,
} from '@/server/imports/cvUpdate/persistChangeSet';
import { CV_CHANGE_ALGORITHM_VERSION } from '@/server/imports/cvUpdate/semanticEquality';

function miniSet(overrides: Partial<CvChangeSet> = {}): CvChangeSet {
  return {
    schemaVersion: 1,
    algorithmVersion: CV_CHANGE_ALGORITHM_VERSION,
    generatedAt: '2026-08-06T00:00:00.000Z',
    importId: 'imp-1',
    candidateSourceTextHash: null,
    baseline: null,
    website: { sourceType: 'canonical' },
    summary: {
      totalChanges: 0,
      safelyPrepared: 0,
      requiresReview: 0,
      unchangedItemCount: 0,
      noWebsiteRelevantChanges: true,
    },
    sectionSummaries: [],
    items: [],
    unknownSections: [],
    changeSetRevision: 'rev-aaa',
    ...overrides,
  };
}

describe('persistImportChangeSet stale / conflict', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears prior decisions when change set revision changes', async () => {
    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      changeSet: miniSet({ changeSetRevision: 'rev-old' }),
    } as never);
    vi.mocked(prisma.contentImport.update).mockResolvedValue({} as never);

    await persistImportChangeSet('imp-1', miniSet({ changeSetRevision: 'rev-new' }));

    expect(prisma.contentImport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'imp-1' },
        data: expect.objectContaining({
          changeDecisions: Prisma.JsonNull,
        }),
      }),
    );
    expect(recordContentEvent).toHaveBeenCalled();
  });

  it('clears prior decisions when algorithm version upgrades', async () => {
    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      changeSet: miniSet({ algorithmVersion: 1, changeSetRevision: 'rev-aaa' }),
    } as never);
    vi.mocked(prisma.contentImport.update).mockResolvedValue({} as never);

    await persistImportChangeSet(
      'imp-1',
      miniSet({ algorithmVersion: CV_CHANGE_ALGORITHM_VERSION + 1, changeSetRevision: 'rev-aaa' }),
    );

    expect(prisma.contentImport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changeDecisions: Prisma.JsonNull,
        }),
      }),
    );
  });

  it('throws CHANGE_SET_REVISION_MISMATCH when decisions revision is stale', async () => {
    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      changeSet: miniSet({ changeSetRevision: 'rev-current' }),
      changeDecisions: null,
    } as never);

    await expect(
      persistImportChangeDecisions('imp-1', {
        schemaVersion: 1,
        changeSetRevision: 'rev-stale',
        savedAt: '2026-08-06T00:00:00.000Z',
        decisions: [{ changeId: 'c1', action: 'accept' }],
      }),
    ).rejects.toMatchObject({
      code: 'CHANGE_SET_REVISION_MISMATCH',
    });

    expect(prisma.contentImport.update).not.toHaveBeenCalled();
  });

  it('throws CHANGE_SET_MISSING when import has no change set', async () => {
    vi.mocked(prisma.contentImport.findUnique).mockResolvedValue({
      changeSet: null,
      changeDecisions: null,
    } as never);

    await expect(
      persistImportChangeDecisions('imp-1', {
        schemaVersion: 1,
        changeSetRevision: 'rev-aaa',
        savedAt: '2026-08-06T00:00:00.000Z',
        decisions: [],
      }),
    ).rejects.toMatchObject({
      code: 'CHANGE_SET_MISSING',
    });
  });
});
