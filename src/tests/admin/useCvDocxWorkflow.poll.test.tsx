// @vitest-environment happy-dom

import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCvDocxWorkflow } from '@/app/admin/upload/hooks/useCvDocxWorkflow';

describe('useCvDocxWorkflow polling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | Request) => {
        const u = typeof url === 'string' ? url : url.url;
        if (u.includes('/api/admin/upload')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              importId: 'imp_test',
              status: 'UPLOADED',
              message: 'queued',
              canCommit: false,
              deviceRequired: true,
              import: { persisted: true, importId: 'imp_test', uploadedFileId: 'uf1', status: 'UPLOADED' },
            }),
          };
        }
        if (u.includes('/api/admin/imports/imp_test') && !u.includes('/process')) {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              import: {
                status: 'PARSED',
                candidatePayload: {
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
                    email: 'a@b.c',
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
                    sourceFileName: 'f.docx',
                    parsedAt: '2026-01-01T00:00:00.000Z',
                    parserVersion: 'v',
                    commitSha: null,
                    uploader: null,
                    warnings: [],
                  },
                },
                warnings: [],
              },
            }),
          };
        }
        return { ok: true, json: async () => ({ ok: true }) };
      }) as unknown as typeof fetch,
    );
  });

  it('enters processing then ready after poll sees PARSED', async () => {
    const { result } = renderHook(() => useCvDocxWorkflow({ push: vi.fn() }));

    const file = new File([new Uint8Array([1, 2, 3])], 'cv.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await act(async () => {
      result.current.handleFileChange({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    await waitFor(
      () => {
        expect(result.current.parsedData?.profile.name).toBe('X');
        expect(result.current.importPhase).toBe('ready');
      },
      { timeout: 8000 },
    );
  });
});
