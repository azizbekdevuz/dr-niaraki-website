/**
 * End-to-end: curated display name + complete intro survive merge without acceptance.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

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

vi.mock('@/server/imports/cvUpdate/persistChangeSet', async () => {
  const actual = await vi.importActual('@/server/imports/cvUpdate/persistChangeSet');
  return {
    ...(actual as Record<string, unknown>),
    loadImportChangeSet: vi.fn(),
    loadImportChangeDecisions: vi.fn(async () => null),
  };
});

vi.mock('@/server/imports/cvUpdate/acceptedBaseline', () => ({
  acceptCvBaselineFromImport: vi.fn(async () => ({ id: 'baseline-1' })),
  getCurrentAcceptedCvBaseline: vi.fn(async () => null),
  CURRENT_BASELINE_SLOT: 'current',
}));

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { prisma } from '@/server/db/prisma';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { generateCvChangeSet } from '@/server/imports/cvUpdate/changeSetGenerate';
import { loadImportChangeSet } from '@/server/imports/cvUpdate/persistChangeSet';
import { CV_CHANGE_ALGORITHM_VERSION } from '@/server/imports/cvUpdate/semanticEquality';
import { generateImportReviewManifest } from '@/server/imports/importCandidateReview/generate';
import { ensureImportReviewManifest } from '@/server/imports/importCandidateReview/service';
import { toStoredApprovalsEnvelope } from '@/server/imports/importCandidateReview/storageSchema';
import { mergeImportCandidateToWorkingDraft } from '@/server/imports/mergeImportToDraft';
import { getContentImportDetail, updateImportStatus } from '@/server/imports/repository';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';

describe('merge preserves curated profile without acceptance', () => {
  beforeEach(() => {
    vi.mocked(getContentImportDetail).mockReset();
    vi.mocked(updateImportStatus).mockReset();
    vi.mocked(prisma.contentVersion.create).mockReset();
    vi.mocked(getWorkingDraft).mockReset();
    vi.mocked(ensureImportReviewManifest).mockReset();
    vi.mocked(loadImportChangeSet).mockReset();
  });

  it('keeps curated display name and complete intro when candidate is downgraded/truncated', async () => {
    const website = assertSiteContent(SITE_CONTENT_RAW);
    const curatedName = 'Dr. Eng. Abolghasem Sadeghi-Niaraki';
    const completeIntro =
      'Dr. Abolghasem Sadeghi-Niaraki is an Associate Professor in the Department of Computer Science and Engineering at Sejong University. From 2009 to 2017, he served as an Assistant Professor.';
    website.profile.displayName = curatedName;
    website.profile.homeAboutIntro = completeIntro;
    website.about.page.professionalSummaryParagraphs = [completeIntro];

    const candidateDetails = minimalImportDetails({
      profile: {
        name: 'Dr. Abolghasem Sadeghi',
        title: 'Associate Professor',
        photoUrl: null,
        summary:
          'Dr. Abolghasem Sadeghi-Niaraki is an Associate Professor ... From 2009 to 2017, he served as an Assistant Pro',
        meta: null,
      },
      about: {
        brief:
          'Dr. Abolghasem Sadeghi-Niaraki is an Associate Professor ... From 2009 to 2017, he served as an Assistant Pro',
        full:
          'Dr. Abolghasem Sadeghi-Niaraki is an Associate Professor ... From 2009 to 2017, he served as an Assistant Pro',
        education: [],
        positions: [],
        awards: [],
        languages: [],
        cvNarrativeSections: [],
      },
    });

    const envelope = buildImportCandidatePayload({
      rawDocumentText: 'cv body',
      parserVersion: 't',
      details: candidateDetails,
      sections: [],
      importWarnings: [],
    });

    const changeSet = generateCvChangeSet({
      importId: 'imp-protect',
      candidateDetails,
      candidateEnvelope: envelope,
      previousBaseline: null,
      website,
      websiteRef: { sourceType: 'working_draft', versionId: 'wd1' },
      fieldLocks: [],
      sectionMappings: [],
      baselineRef: null,
    });
    expect(changeSet.algorithmVersion).toBe(CV_CHANGE_ALGORITHM_VERSION);
    expect(changeSet.items.some((i) => i.fieldPath === 'profile.displayName')).toBe(true);
    expect(
      changeSet.items.some(
        (i) =>
          i.fieldPath === 'profile.homeAboutIntro' ||
          i.fieldPath === 'about.page.professionalSummaryParagraphs',
      ),
    ).toBe(true);

    const { envelope: reviewEnvelope, manifest } = await generateImportReviewManifest({
      importId: 'imp-protect',
      sourceFileName: 't.docx',
      sourceTextHash: envelope.sourceTextHash,
      candidate: candidateDetails,
    });
    const blockingApprovals = manifest.decisions
      .filter(
        (d) =>
          (d.action === 'manual-review' || d.action === 'remove-artifact') &&
          d.section !== 'patents' &&
          d.section !== 'research',
      )
      .map((d) => ({ decisionId: d.decisionId, approvedAction: 'skip' as const }));
    const approvalsEnvelope =
      blockingApprovals.length > 0
        ? toStoredApprovalsEnvelope({
            manifestRevision: reviewEnvelope.manifestRevision,
            approvals: blockingApprovals,
          })
        : null;

    vi.mocked(getWorkingDraft).mockResolvedValue({
      id: 'wd1',
      status: 'DRAFT',
      draftSlot: 'main',
      payload: website,
      label: 'draft',
      importId: null,
      changeSummary: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      publishSequence: null,
    } as never);

    vi.mocked(getContentImportDetail).mockResolvedValue({
      id: 'imp-protect',
      status: 'PARSED',
      candidatePayload: envelope,
      reviewManifest: reviewEnvelope,
      reviewApprovals: approvalsEnvelope,
      uploadedFile: { originalName: 't.docx' },
      uploadedFileId: 'uf1',
      parserVersion: 't',
      warnings: null,
      rawExtract: null,
      rawPreviewPath: null,
      changeSet,
      changeDecisions: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: [],
    } as never);

    vi.mocked(ensureImportReviewManifest).mockResolvedValue(reviewEnvelope as never);
    vi.mocked(loadImportChangeSet).mockResolvedValue(changeSet);
    vi.mocked(prisma.contentVersion.update).mockImplementation((async ({ data }: { data: { payload?: unknown } }) => {
      const payload = data.payload;
      return {
        id: 'wd1',
        status: 'DRAFT',
        draftSlot: 'main',
        payload,
        label: 'draft',
        importId: 'imp-protect',
        changeSummary: null,
        createdBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: null,
        publishSequence: null,
      };
    }) as never);
    vi.mocked(updateImportStatus).mockResolvedValue({} as never);

    const result = await mergeImportCandidateToWorkingDraft({
      importId: 'imp-protect',
      action: 'replace',
      mergeMode: 'safe_update',
    });

    const draft = validateSiteContent(result.version.payload);
    expect(draft.success).toBe(true);
    if (!draft.success) {return;}
    expect(draft.data.profile.displayName).toBe(curatedName);
    expect(draft.data.profile.homeAboutIntro).toContain('Assistant Professor');
    expect(draft.data.profile.homeAboutIntro.endsWith('Pro')).toBe(false);
  });
});
