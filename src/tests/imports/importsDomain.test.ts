import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/content/contentWorkflowCore', async () => {
  const actual = await vi.importActual('@/server/content/contentWorkflowCore');
  return {
    ...(actual as Record<string, unknown>),
    getWorkingDraft: vi.fn().mockResolvedValue(null),
    getLatestPublishedVersion: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('@/server/db/prisma', () => ({
  prisma: {
    uploadedFile: { findUnique: vi.fn(), create: vi.fn() },
    contentImport: { create: vi.fn(), update: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from '@/server/db/prisma';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { generateImportReviewManifest } from '@/server/imports/importCandidateReview/generate';
import * as reconcileModule from '@/server/imports/importCandidateReview/reconcile';
import { toStoredApprovalsEnvelope } from '@/server/imports/importCandidateReview/storageSchema';
import { isTerminalImportStatus } from '@/server/imports/importStatus';
import {
  createContentImportRecord,
  saveImportCandidateAndWarnings,
  updateImportStatus,
} from '@/server/imports/repository';
import { parseImportWarnings, toImportDetail, toImportSummary, buildImportCandidateReconcileReview } from '@/server/imports/serialize';
import { ImportDomainError } from '@/server/imports/types';
import { minimalImportDetails as fixtureImportDetails } from '@/tests/fixtures/minimalImportDetails';
import type { DetectedSection } from '@/types/parser';
import { validateDetails } from '@/validators/detailsSchema';

const minimalImportDetails = {
  profile: { name: 'X', title: null, photoUrl: null, summary: null, meta: null },
  about: {
    brief: null,
    full: null,
    education: [],
    positions: [],
    awards: [],
    languages: [],
    cvNarrativeSections: [],
  },
  research: { interests: [], projects: [], grants: [] },
  publications: [],
  patents: [],
  contact: {
    email: 'x@y.com',
    personalEmail: null,
    phone: null,
    fax: null,
    cellPhone: null,
    address: null,
    department: null,
    university: null,
    website: null,
    cvUrl: null,
    social: {},
  },
  rawHtml: null,
  counts: { publications: 0, patents: 0, projects: 0, awards: 0, students: 0 },
  meta: {
    sourceFileName: 'cv.docx',
    parsedAt: '2026-01-02T03:04:05.000Z',
    parserVersion: '1',
    commitSha: null,
    uploader: null,
    warnings: [],
  },
};

describe('importsDomain', () => {
  it('parseImportWarnings accepts a valid array and falls back for invalid shapes', () => {
    expect(parseImportWarnings([{ message: 'x' }])).toEqual([{ message: 'x' }]);
    expect(parseImportWarnings([{ message: 'a', code: 'C' }])).toEqual([{ message: 'a', code: 'C' }]);
    expect(parseImportWarnings({ not: 'array' })).toEqual([]);
    expect(parseImportWarnings(null)).toEqual([]);
  });

  it('isTerminalImportStatus marks merged/rejected/failed only', () => {
    expect(isTerminalImportStatus('MERGED')).toBe(true);
    expect(isTerminalImportStatus('REJECTED')).toBe(true);
    expect(isTerminalImportStatus('FAILED')).toBe(true);
    expect(isTerminalImportStatus('UPLOADED')).toBe(false);
    expect(isTerminalImportStatus('PARSED')).toBe(false);
    expect(isTerminalImportStatus('NEEDS_REVIEW')).toBe(false);
  });

  it('toImportSummary and toImportDetail shape API-safe JSON', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const updatedAt = new Date('2026-01-03T03:04:05.000Z');
    const row = {
      id: 'imp1',
      uploadedFileId: 'up1',
      status: 'NEEDS_REVIEW' as const,
      parserVersion: '1',
      warnings: [{ message: 'w' }],
      rawPreviewPath: null,
      rawExtract: { a: 1 },
      candidatePayload: minimalImportDetails,
      reviewManifest: null,
      reviewApprovals: null,
      createdAt,
      updatedAt,
      uploadedFile: {
        id: 'up1',
        originalName: 'cv.docx',
        storedPath: '/files/cv.docx',
        mimeType: 'application/whatever',
        sizeBytes: 10,
        sha256: 'abc',
        sourceFormat: 'DOCX' as const,
        uploadedAt: createdAt,
      },
      versions: [{ id: 'ver1' }],
    };
    expect(toImportSummary(row)).toEqual({
      id: 'imp1',
      uploadedFileId: 'up1',
      status: 'NEEDS_REVIEW',
      parserVersion: '1',
      originalFileName: 'cv.docx',
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    const detail = toImportDetail(row);
    expect(detail.warnings).toEqual([{ message: 'w' }]);
    expect(detail.linkedVersionIds).toEqual(['ver1']);
    expect(detail.candidatePayload).toEqual(minimalImportDetails);
    expect(detail.rawExtract).toEqual({ a: 1 });
    expect(detail.candidateSummary).toEqual({
      profileName: 'X',
      publicationCount: 0,
      patentCount: 0,
      rawHtmlTruncated: false,
    });
    expect(detail.candidateReview).toBeNull();
    expect(detail.candidateReconcileReview).toBeNull();
  });

  it('toImportDetail returns corrupted reconciliation DTO for malformed stored approvals', async () => {
    const candidate = fixtureImportDetails();
    const payload = buildImportCandidatePayload({
      rawDocumentText: 'cv body',
      parserVersion: '1',
      details: candidate,
      sections: [],
      importWarnings: [],
    });
    const { envelope } = await generateImportReviewManifest({
      importId: 'imp-corrupt',
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const updatedAt = new Date('2026-01-03T03:04:05.000Z');
    const row = {
      id: 'imp-corrupt',
      uploadedFileId: 'up1',
      status: 'PARSED' as const,
      parserVersion: '1',
      warnings: [],
      rawPreviewPath: null,
      rawExtract: null,
      candidatePayload: payload as unknown as Prisma.JsonValue,
      reviewManifest: envelope,
      reviewApprovals: { corrupted: true },
      createdAt,
      updatedAt,
      uploadedFile: {
        id: 'up1',
        originalName: 'cv.docx',
        storedPath: '/files/cv.docx',
        mimeType: 'application/whatever',
        sizeBytes: 10,
        sha256: 'abc',
        sourceFormat: 'DOCX' as const,
        uploadedAt: createdAt,
      },
      versions: [],
    };
    const detail = toImportDetail(row);
    expect(detail.candidateReconcileReview).not.toBeNull();
    expect(detail.candidateReconcileReview!.loadError?.code).toBe('REVIEW_APPROVALS_INVALID');
    expect(detail.candidateReconcileReview!.mergeReviewBlocked).toBe(true);
    expect(detail.candidateReconcileReview!.hasManifest).toBe(true);
  });

  it('buildImportCandidateReconcileReview returns stale approvals load error without throwing', async () => {
    const candidate = fixtureImportDetails();
    const payload = buildImportCandidatePayload({
      rawDocumentText: 'cv body',
      parserVersion: '1',
      details: candidate,
      sections: [],
      importWarnings: [],
    });
    const { envelope } = await generateImportReviewManifest({
      importId: 'imp-stale',
      sourceFileName: 'cv.docx',
      sourceTextHash: payload.sourceTextHash,
      candidate,
    });
    const staleApprovals = toStoredApprovalsEnvelope({
      manifestRevision: 'deadbeefdeadbeefdeadbeefdeadbeef',
      approvals: [],
    });
    const review = buildImportCandidateReconcileReview({
      reviewManifest: envelope,
      reviewApprovals: staleApprovals,
    });
    expect(review).not.toBeNull();
    expect(review!.loadError?.code).toBe('REVIEW_APPROVALS_STALE');
    expect(review!.mergeReviewBlocked).toBe(true);
  });

  it('buildImportCandidateReconcileReview does not swallow unknown programming errors', async () => {
    const spy = vi.spyOn(reconcileModule, 'loadImportReviewStateFromRow').mockImplementation(() => {
      throw new Error('unexpected programming failure');
    });
    expect(() =>
      buildImportCandidateReconcileReview({
        reviewManifest: { storageVersion: 1 },
        reviewApprovals: null,
      }),
    ).toThrow('unexpected programming failure');
    spy.mockRestore();
  });

  it('toImportDetail has null candidateReview for malformed candidatePayload', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const updatedAt = new Date('2026-01-03T03:04:05.000Z');
    const row = {
      id: 'imp-bad',
      uploadedFileId: 'up1',
      status: 'NEEDS_REVIEW' as const,
      parserVersion: '1',
      warnings: [],
      rawPreviewPath: null,
      rawExtract: null,
      candidatePayload: { notValidDetails: true },
      reviewManifest: null,
      reviewApprovals: null,
      createdAt,
      updatedAt,
      uploadedFile: {
        id: 'up1',
        originalName: 'cv.docx',
        storedPath: '/files/cv.docx',
        mimeType: 'application/whatever',
        sizeBytes: 10,
        sha256: 'abc',
        sourceFormat: 'DOCX' as const,
        uploadedAt: createdAt,
      },
      versions: [],
    };
    const detail = toImportDetail(row);
    expect(detail.candidateReview).toBeNull();
    expect(detail.candidateSummary).toBeNull();
    expect(detail.candidateReconcileReview).toBeNull();
  });

  it('toImportDetail includes candidateReview for envelope payloads', () => {
    const vd = validateDetails(minimalImportDetails);
    expect(vd.success).toBe(true);
    const sections: DetectedSection[] = [
      { type: 'patents', title: 'Patents', content: 'Patent A', confidence: 1 },
    ];
    const envelope = buildImportCandidatePayload({
      rawDocumentText: 'Patents (99 Registered & Completed)\n\nX',
      parserVersion: 'pv',
      details: vd.data!,
      sections,
      importWarnings: [{ message: 'aux', code: 'INFO_LINE' }],
    });
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const updatedAt = new Date('2026-01-03T03:04:05.000Z');
    const row = {
      id: 'imp-env',
      uploadedFileId: 'up1',
      status: 'PARSED' as const,
      parserVersion: 'pv',
      warnings: [],
      rawPreviewPath: null,
      rawExtract: null,
      candidatePayload: envelope as unknown as Prisma.JsonValue,
      reviewManifest: null,
      reviewApprovals: null,
      createdAt,
      updatedAt,
      uploadedFile: {
        id: 'up1',
        originalName: 'cv.docx',
        storedPath: '/files/cv.docx',
        mimeType: 'application/whatever',
        sizeBytes: 10,
        sha256: 'abc',
        sourceFormat: 'DOCX' as const,
        uploadedAt: createdAt,
      },
      versions: [],
    };
    const detail = toImportDetail(row);
    expect(detail.candidateReview).not.toBeNull();
    expect(detail.candidateReview!.schemaVersion).toBe(2);
    expect(detail.candidateReview!.envelopeVersion).toBe(1);
    expect(detail.candidateReview!.sourceTextHash).toMatch(/^[a-f0-9]{64}$/);
    expect(detail.candidateReview!.rawSectionSummaries).toHaveLength(1);
    expect(detail.candidateReview!.sectionMappingReport.length).toBeGreaterThanOrEqual(1);
    expect(detail.candidateReview!.parserWarnings.some((w) => w.severity === 'info')).toBe(true);
    const patentEntry = detail.candidateReview!.countValidation.entries.find((e) => e.code === 'PATENT_COUNT_MISMATCH');
    expect(patentEntry).toBeDefined();
    expect(patentEntry!.severity).toBe('warning');
    expect(detail.candidateReconcileReview).toBeNull();
  });
});

describe('imports repository (mocked prisma)', () => {
  beforeEach(() => {
    vi.mocked(prisma.uploadedFile.findUnique).mockReset();
    vi.mocked(prisma.contentImport.create).mockReset();
    vi.mocked(prisma.contentImport.update).mockReset();
  });

  it('createContentImportRecord throws when uploaded file is missing', async () => {
    vi.mocked(prisma.uploadedFile.findUnique).mockResolvedValue(null);
    await expect(createContentImportRecord('missing')).rejects.toBeInstanceOf(ImportDomainError);
  });

  it('createContentImportRecord creates import when file exists', async () => {
    vi.mocked(prisma.uploadedFile.findUnique).mockResolvedValue({
      id: 'up1',
      originalName: 'a.docx',
      storedPath: 'p',
      mimeType: 'm',
      sizeBytes: 1,
      sha256: 'h',
      sourceFormat: 'DOCX',
      uploadedAt: new Date(),
    });
    vi.mocked(prisma.contentImport.create).mockResolvedValue({
      id: 'i1',
      uploadedFileId: 'up1',
      status: 'UPLOADED',
      parserVersion: null,
      warnings: null,
      rawPreviewPath: null,
      rawExtract: null,
      candidatePayload: null,
      reviewManifest: null,
      reviewApprovals: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const imp = await createContentImportRecord('up1');
    expect(imp.id).toBe('i1');
    expect(prisma.contentImport.create).toHaveBeenCalledWith({
      data: { uploadedFileId: 'up1', status: 'UPLOADED' },
    });
  });

  it('updateImportStatus maps missing rows to ImportDomainError', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
    vi.mocked(prisma.contentImport.update).mockRejectedValue(err);
    await expect(updateImportStatus('nope', 'FAILED')).rejects.toBeInstanceOf(ImportDomainError);
  });

  it('saveImportCandidateAndWarnings stores candidate separate from draft workflow', async () => {
    vi.mocked(prisma.contentImport.update).mockResolvedValue({
      id: 'i1',
      uploadedFileId: 'up1',
      status: 'NEEDS_REVIEW',
      parserVersion: 'pv',
      warnings: [{ message: 'm' }],
      rawPreviewPath: null,
      rawExtract: null,
      candidatePayload: { x: 1 },
      reviewManifest: null,
      reviewApprovals: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveImportCandidateAndWarnings('i1', {
      candidatePayload: { only: 'candidate' },
      warnings: [{ message: 'check' }],
    });
    expect(prisma.contentImport.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: {
        candidatePayload: { only: 'candidate' },
        warnings: [{ message: 'check' }],
        status: 'NEEDS_REVIEW',
      },
    });
  });
});
