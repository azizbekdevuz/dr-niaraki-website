import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/imports/repository', () => ({
  persistImportParseOutcome: vi.fn(),
  persistImportParseFailure: vi.fn(),
}));

vi.mock('@/parser/docxParser', () => ({
  PARSER_VERSION: 'test-parser',
  parseDocxToDetails: vi.fn(),
}));

import { parseDocxToDetails } from '@/parser/docxParser';
import { persistImportParseFailure, persistImportParseOutcome } from '@/server/imports/repository';
import {
  runDocxImportParseJob,
  scheduleDocxImportParseAfterResponse,
  DocxImportParseError,
} from '@/server/imports/runDocxImportParseJob';
import type { Details } from '@/types/details';

const sampleDetails: Details = {
  profile: { name: 'N', title: null, photoUrl: null, summary: null, meta: null },
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
  publications: [{ id: 'p1', title: 'Paper', authors: null, journal: null, year: 2024, type: 'journal', raw: null }],
  patents: [],
  contact: {
    email: 'n@univ.edu',
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
  rawHtml: '<p>x</p>',
  counts: { publications: 1, patents: 0, projects: 0, awards: 0, students: 0 },
  meta: {
    sourceFileName: 'c.docx',
    parsedAt: '2026-01-01T00:00:00.000Z',
    parserVersion: 'test-parser',
    commitSha: null,
    uploader: 'admin',
    warnings: [],
  },
};

describe('runDocxImportParseJob', () => {
  beforeEach(() => {
    vi.mocked(parseDocxToDetails).mockReset();
    vi.mocked(persistImportParseOutcome).mockReset();
    vi.mocked(persistImportParseFailure).mockReset();
    vi.mocked(parseDocxToDetails).mockResolvedValue({ data: sampleDetails, warnings: [] });
    vi.mocked(persistImportParseOutcome).mockResolvedValue({} as never);
    vi.mocked(persistImportParseFailure).mockResolvedValue({} as never);
  });

  it('persists parse outcome and returns terminal status', async () => {
    const r = await runDocxImportParseJob({
      importId: 'im1',
      uploadedFileId: 'uf1',
      buffer: Buffer.from('x'),
      originalName: 'c.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploaderLabel: 'admin',
    });
    expect(['PARSED', 'NEEDS_REVIEW']).toContain(r.import.status);
    expect(persistImportParseOutcome).toHaveBeenCalledWith(
      'im1',
      expect.objectContaining({ parserVersion: 'test-parser' }),
    );
  });

  it('marks FAILED and throws DocxImportParseError when parser throws', async () => {
    vi.mocked(parseDocxToDetails).mockRejectedValue(new Error('mammoth blew up'));
    await expect(
      runDocxImportParseJob({
        importId: 'im1',
        uploadedFileId: 'uf1',
        buffer: Buffer.from('x'),
        originalName: 'c.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploaderLabel: null,
      }),
    ).rejects.toBeInstanceOf(DocxImportParseError);
    expect(persistImportParseFailure).toHaveBeenCalledWith(
      'im1',
      expect.objectContaining({ parserVersion: 'test-parser' }),
    );
  });
});

describe('scheduleDocxImportParseAfterResponse', () => {
  beforeEach(() => {
    vi.mocked(parseDocxToDetails).mockReset();
    vi.mocked(persistImportParseOutcome).mockReset();
    vi.mocked(parseDocxToDetails).mockResolvedValue({ data: sampleDetails, warnings: [] });
    vi.mocked(persistImportParseOutcome).mockResolvedValue({} as never);
  });

  it('does not parse synchronously; runs when scheduled callback executes', async () => {
    const queued: Array<() => void | Promise<void>> = [];
    const mockAfter = (fn: () => void | Promise<void>) => {
      queued.push(fn);
    };

    scheduleDocxImportParseAfterResponse(mockAfter, {
      importId: 'im1',
      uploadedFileId: 'uf1',
      buffer: Buffer.from('docx'),
      originalName: 'c.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploaderLabel: 'admin',
    });

    expect(parseDocxToDetails).not.toHaveBeenCalled();
    expect(queued).toHaveLength(1);
    await queued[0]!();
    expect(parseDocxToDetails).toHaveBeenCalled();
  });
});
