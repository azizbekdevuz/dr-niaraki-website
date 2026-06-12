/** @vitest-environment node */

import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (name === 'admin_session' ? { value: 'sess-test' } : undefined),
  })),
}));

vi.mock('@/lib/admin-auth', () => ({
  hasValidAdminAccess: vi.fn(),
}));

vi.mock('@/server/admin/contentWorkflowAccess', () => ({
  requireFullAdminAccessForContent: vi.fn(),
}));

vi.mock('@/server/imports/repository', () => ({
  getContentImportDetail: vi.fn(),
  getPriorImportSourceTextHash: vi.fn(),
}));

vi.mock('@/server/content/contentWorkflowCore', async () => {
  const actual = await vi.importActual('@/server/content/contentWorkflowCore');
  return {
    ...(actual as Record<string, unknown>),
    getWorkingDraft: vi.fn(),
    getLatestPublishedVersion: vi.fn(),
  };
});

vi.mock('@/server/content/contentEvents', () => ({
  recordContentEvent: vi.fn(),
}));

import { hasValidAdminAccess } from '@/lib/admin-auth';
import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import * as aiReviewRateLimit from '@/server/ai/aiReviewRateLimit';
import { redactSensitiveText } from '@/server/ai/aiReviewRedact';
import { buildAiReviewInput, hashAiReviewInput } from '@/server/ai/buildAiReviewInput';
import { getAiReviewProvider } from '@/server/ai/providerRegistry';
import { runImportAiReview } from '@/server/ai/runImportAiReview';
import { recordContentEvent } from '@/server/content/contentEvents';
import { getLatestPublishedVersion, getWorkingDraft } from '@/server/content/contentWorkflowCore';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { buildImportReviewPayload } from '@/server/imports/importReviewCompare';
import { getContentImportDetail, getPriorImportSourceTextHash } from '@/server/imports/repository';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';

const IMPORT_ID = 'imp-ai-review';

function envelopeFromDetails(
  details: ReturnType<typeof minimalImportDetails>,
  rawDocumentText: string,
  importWarnings: { message: string; code?: string }[] = [],
) {
  return buildImportCandidatePayload({
    rawDocumentText,
    parserVersion: 't',
    details,
    sections: [],
    importWarnings,
  });
}

function mockImportRow(envelope: ReturnType<typeof buildImportCandidatePayload>) {
  vi.mocked(getContentImportDetail).mockResolvedValue({
    id: IMPORT_ID,
    status: 'PARSED',
    parserVersion: 't',
    candidatePayload: envelope,
    warnings: [],
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    uploadedFile: {
      originalName: 'cv.docx',
      storedPath: '/uploads/cv.docx',
      id: 'uf-ai',
    },
    versions: [],
  } as never);
}

describe('import AI review', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    vi.mocked(hasValidAdminAccess).mockReset();
    vi.mocked(requireFullAdminAccessForContent).mockReset();
    vi.mocked(getContentImportDetail).mockReset();
    vi.mocked(getPriorImportSourceTextHash).mockReset();
    vi.mocked(getWorkingDraft).mockReset();
    vi.mocked(getLatestPublishedVersion).mockReset();
    vi.mocked(recordContentEvent).mockReset();
    vi.mocked(getPriorImportSourceTextHash).mockResolvedValue(null);
    vi.mocked(getWorkingDraft).mockResolvedValue(null);
    vi.mocked(getLatestPublishedVersion).mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env = envBackup;
    vi.unstubAllGlobals();
  });

  describe('auth', () => {
    it('rejects unauthenticated AI review route', async () => {
      vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(
        NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }),
      );
      const { POST } = await import('@/app/api/admin/imports/[id]/ai-review/route');
      const res = await POST(
        new NextRequest('http://localhost/api/admin/imports/x/ai-review', {
          method: 'POST',
          body: JSON.stringify({ baseline: 'auto' }),
        }),
        { params: Promise.resolve({ id: IMPORT_ID }) },
      );
      expect(res.status).toBe(401);
    });

    it('rejects session without registered device', async () => {
      vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(
        NextResponse.json({ ok: false, error: 'DEVICE_REQUIRED' }, { status: 403 }),
      );
      const { POST } = await import('@/app/api/admin/imports/[id]/ai-review/route');
      const res = await POST(
        new NextRequest('http://localhost/api/admin/imports/x/ai-review', { method: 'POST', body: '{}' }),
        { params: Promise.resolve({ id: IMPORT_ID }) },
      );
      expect(res.status).toBe(403);
    });

    it('allows full admin/device access', async () => {
      vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
      process.env.AI_PROVIDER = 'none';
      const { POST } = await import('@/app/api/admin/imports/[id]/ai-review/route');
      const res = await POST(
        new NextRequest('http://localhost/api/admin/imports/x/ai-review', { method: 'POST', body: '{}' }),
        { params: Promise.resolve({ id: IMPORT_ID }) },
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.result.advisory).toBe(true);
      expect(json.result.status).toBe('disabled');
    });
  });

  describe('provider none', () => {
    it('returns disabled advisory when AI_PROVIDER unset without loading import', async () => {
      delete process.env.AI_PROVIDER;
      const rateLimitSpy = vi.spyOn(aiReviewRateLimit, 'checkAiReviewRateLimit');
      const outcome = await runImportAiReview(IMPORT_ID, 'auto');
      expect(outcome).toMatchObject({ ok: true });
      if (!('ok' in outcome) || !outcome.ok) {
        throw new Error('expected ok');
      }
      expect(outcome.result.advisory).toBe(true);
      expect(outcome.result.enabled).toBe(false);
      expect(outcome.result.status).toBe('disabled');
      expect(outcome.result.provider).toBe('none');
      expect(outcome.result.inputHash).toBe('');
      expect(getContentImportDetail).not.toHaveBeenCalled();
      expect(rateLimitSpy).not.toHaveBeenCalled();
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
      rateLimitSpy.mockRestore();
    });

    it('does not consume rate limit on repeated disabled requests', async () => {
      delete process.env.AI_PROVIDER;
      process.env.AI_IMPORT_REVIEW_RATE_LIMIT_PER_HOUR = '1';
      const rateLimitSpy = vi.spyOn(aiReviewRateLimit, 'checkAiReviewRateLimit');
      await runImportAiReview(IMPORT_ID, 'auto');
      await runImportAiReview(IMPORT_ID, 'auto');
      expect(rateLimitSpy).not.toHaveBeenCalled();
      rateLimitSpy.mockRestore();
    });
  });

  describe('misconfigured providers', () => {
    it('openai without API key returns misconfigured advisory', async () => {
      process.env.AI_PROVIDER = 'openai';
      delete process.env.OPENAI_API_KEY;
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      const details = minimalImportDetails();
      mockImportRow(envelopeFromDetails(details, 'cv'));
      const built = await buildAiReviewInput(IMPORT_ID, 'auto');
      expect(built).not.toBeNull();
      const provider = getAiReviewProvider('openai');
      const result = await provider.generateSuggestions(built!.input, built!.inputHash);
      expect(result.advisory).toBe(true);
      expect(result.status).toBe('misconfigured');
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('ollama unavailable returns advisory error without throwing', async () => {
      process.env.AI_PROVIDER = 'ollama';
      process.env.OLLAMA_MODEL = 'llama3.1:8b';
      process.env.OLLAMA_ALLOWED_MODELS = 'llama3.1:8b';
      vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'));
      const details = minimalImportDetails();
      mockImportRow(envelopeFromDetails(details, 'cv'));
      const built = await buildAiReviewInput(IMPORT_ID, 'auto');
      const provider = getAiReviewProvider('ollama');
      const result = await provider.generateSuggestions(built!.input, built!.inputHash);
      expect(result.advisory).toBe(true);
      expect(result.status).toBe('error');
      expect(result.error).toBeTruthy();
    });
  });

  describe('mock provider fetch', () => {
    it('returns structured suggestions from valid provider JSON', async () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: 'Patent counts look suspicious; review manually.',
                    sectionNotes: [
                      {
                        sectionId: 'patents',
                        severity: 'warning',
                        message: 'Declared vs extracted patent count differs.',
                        suggestedAction: 'check_counts',
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
      );
      const details = minimalImportDetails();
      mockImportRow(envelopeFromDetails(details, 'cv'));
      const outcome = await runImportAiReview(IMPORT_ID, 'auto');
      expect(outcome).toMatchObject({ ok: true });
      if (!('ok' in outcome) || !outcome.ok) {
        throw new Error('expected ok');
      }
      expect(outcome.result.status).toBe('ok');
      expect(outcome.result.summary).toContain('Patent');
      expect(outcome.result.sectionNotes?.[0]?.sectionId).toBe('patents');
    });

    it('malformed provider JSON returns advisory error', async () => {
      process.env.AI_PROVIDER = 'groq';
      process.env.GROQ_API_KEY = 'gsk-test';
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: 'not json at all' } }] }),
          { status: 200 },
        ),
      );
      const details = minimalImportDetails();
      mockImportRow(envelopeFromDetails(details, 'cv'));
      const built = await buildAiReviewInput(IMPORT_ID, 'auto');
      const provider = getAiReviewProvider('groq');
      const result = await provider.generateSuggestions(built!.input, built!.inputHash);
      expect(result.status).toBe('error');
      expect(result.error).toContain('malformed');
    });

    it('timeout is handled as advisory timeout', async () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      vi.mocked(fetch).mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));
      const details = minimalImportDetails();
      mockImportRow(envelopeFromDetails(details, 'cv'));
      const built = await buildAiReviewInput(IMPORT_ID, 'auto');
      const provider = getAiReviewProvider('openai');
      const result = await provider.generateSuggestions(built!.input, built!.inputHash);
      expect(result.advisory).toBe(true);
      expect(['timeout', 'error']).toContain(result.status);
    });
  });

  describe('no mutation', () => {
    it('disabled AI review does not read import row', async () => {
      process.env.AI_PROVIDER = 'none';
      await runImportAiReview(IMPORT_ID, 'auto');
      expect(getContentImportDetail).not.toHaveBeenCalled();
      expect(recordContentEvent).not.toHaveBeenCalled();
    });
  });

  describe('data minimization', () => {
    it('buildAiReviewInput excludes rawDocumentText and redacts contact values', async () => {
      const raw = 'Contact: prof@uni.edu https://example.com +1-555-123-4567\nPatents (52)\nbody';
      const details = minimalImportDetails({
        contact: {
          ...minimalImportDetails().contact,
          email: 'prof@uni.edu',
          phone: '+1-555-123-4567',
          website: 'https://example.com',
        },
      });
      const envelope = envelopeFromDetails(details, raw, [
        { code: 'CONTACT_HINT', message: 'Found email prof@uni.edu and https://secret.example/path' },
      ]);
      mockImportRow(envelope);
      const built = await buildAiReviewInput(IMPORT_ID, 'auto');
      expect(built).not.toBeNull();
      const serialized = JSON.stringify(built!.input);
      expect(serialized).not.toContain('rawDocumentText');
      expect(serialized).not.toContain('prof@uni.edu');
      expect(serialized).not.toContain('https://example.com');
      expect(serialized).not.toContain('https://secret.example');
      expect(serialized).toContain('[redacted-email]');
      expect(serialized).toContain('[redacted-url]');
      expect(built!.input.mergeSafety.sections.length).toBeGreaterThan(0);
      expect(built!.inputHash).toMatch(/^[a-f0-9]{64}$/);
      expect(hashAiReviewInput(built!.input)).toBe(built!.inputHash);
    });

    it('caps oversized input by dropping block previews', async () => {
      process.env.AI_IMPORT_REVIEW_MAX_INPUT_CHARS = '5000';
      const lines = Array.from(
        { length: 80 },
        (_, i) => `Publication line ${i} with extra padding text and more words to inflate review payload`,
      );
      const details = minimalImportDetails({
        publications: lines.map((title, i) => ({
          id: `pub-${i}`,
          title,
          authors: null,
          journal: null,
          year: 2020,
          volume: null,
          issue: null,
          pages: null,
          doi: null,
          link: null,
          type: 'journal' as const,
          raw: null,
        })),
        counts: { publications: 80, patents: 0, projects: 0, awards: 0, students: 0 },
      });
      mockImportRow(envelopeFromDetails(details, 'x'.repeat(8000)));
      const built = await buildAiReviewInput(IMPORT_ID, 'auto');
      expect(built).not.toBeNull();
      expect(JSON.stringify(built!.input).length).toBeLessThanOrEqual(5000);
    });
  });

  describe('redact helper', () => {
    it('redacts emails phones and urls', () => {
      const out = redactSensitiveText('Email a@b.co phone 555-123-4567 url https://x.test/y');
      expect(out).toContain('[redacted-email]');
      expect(out).toContain('[redacted-phone]');
      expect(out).toContain('[redacted-url]');
    });
  });

  describe('audit logging', () => {
    it('records minimal AI_IMPORT_REVIEW event for enabled provider without prompt text', async () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify({ summary: 'ok' }) } }],
          }),
          { status: 200 },
        ),
      );
      const details = minimalImportDetails();
      mockImportRow(envelopeFromDetails(details, 'cv'));
      await runImportAiReview(IMPORT_ID, 'auto');
      expect(recordContentEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'SYSTEM_NOTE',
          payload: expect.objectContaining({
            kind: 'AI_IMPORT_REVIEW',
            importId: IMPORT_ID,
            provider: 'openai',
          }),
        }),
      );
      const call = vi.mocked(recordContentEvent).mock.calls[0]?.[0];
      expect(JSON.stringify(call)).not.toContain('cv');
    });
  });

  describe('merge safety unchanged', () => {
    it('buildImportReviewPayload still defaults to safe_update with ack for full_replace', async () => {
      const details = minimalImportDetails({
        profile: { ...minimalImportDetails().profile, name: 'Safety Check' },
      });
      mockImportRow(envelopeFromDetails(details, 'cv'));
      const review = await buildImportReviewPayload(IMPORT_ID);
      expect(review.mergeSafety.defaultMergeMode).toBe('safe_update');
      expect(review.mergeSafety.fullReplaceRequiresAck).toBe(true);
    });
  });
});
