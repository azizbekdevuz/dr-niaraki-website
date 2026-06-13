/** @vitest-environment node */

import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/admin/contentWorkflowAccess', () => ({
  requireFullAdminAccessForContent: vi.fn(),
}));

vi.mock('@/server/admin/contentWorkflowHttp', () => ({
  internalErrorResponse: vi.fn(() =>
    NextResponse.json({ ok: false, error: 'INTERNAL_ERROR', message: 'Internal server error' }, { status: 500 }),
  ),
}));

vi.mock('@/server/ai/aiRuntimeSettings', () => ({
  AiRuntimeSettingsConflictError: class AiRuntimeSettingsConflictError extends Error {
    name = 'AiRuntimeSettingsConflictError';
  },
  AiRuntimeSettingsValidationError: class AiRuntimeSettingsValidationError extends Error {
    name = 'AiRuntimeSettingsValidationError';
    constructor(message: string) {
      super(message);
    }
  },
  getAiRuntimeSettingsView: vi.fn(),
  isSelectableProviderId: vi.fn((v: string) =>
    ['ollama', 'openrouter', 'groq', 'openai'].includes(v),
  ),
  resolveAdminActorEmail: vi.fn(async () => 'prof@test.edu'),
  saveAiRuntimeSettings: vi.fn(),
}));

import { GET, PUT } from '@/app/api/admin/ai/settings/route';
import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import type { AiProviderSettingsView } from '@/server/ai/aiReviewTypes';
import {
  AiRuntimeSettingsConflictError,
  AiRuntimeSettingsValidationError,
  getAiRuntimeSettingsView,
  saveAiRuntimeSettings,
} from '@/server/ai/aiRuntimeSettings';

const sampleView: AiProviderSettingsView = {
  enabled: true,
  activeProvider: 'groq',
  activeModel: 'llama-3.1-8b-instant',
  source: 'database' as const,
  revision: 1,
  savedEnabled: true,
  savedProvider: 'groq',
  savedModel: 'llama-3.1-8b-instant',
  switchingMode: 'runtime_database' as const,
  switchingNote: 'saved',
  providers: [
    {
      id: 'groq',
      label: 'Groq - Hosted, fast',
      status: 'configured',
      active: true,
      selectable: true,
      model: 'llama-3.1-8b-instant',
      allowedModels: ['llama-3.1-8b-instant'],
      statusMessage: 'Available',
    },
  ],
  disclaimers: ['Advisory only'],
};

describe('AI settings API', () => {
  beforeEach(() => {
    vi.mocked(requireFullAdminAccessForContent).mockReset();
    vi.mocked(getAiRuntimeSettingsView).mockReset();
    vi.mocked(saveAiRuntimeSettings).mockReset();
    vi.mocked(internalErrorResponse).mockClear();
  });

  it('GET requires full admin/device access', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(
      NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }),
    );
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('PUT requires full admin/device access', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(
      NextResponse.json({ ok: false, error: 'DEVICE_REQUIRED' }, { status: 403 }),
    );
    const res = await PUT(
      new NextRequest('http://localhost/api/admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: null,
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('GET returns sanitized settings without secrets', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
    vi.mocked(getAiRuntimeSettingsView).mockResolvedValue(sampleView);
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(JSON.stringify(json)).not.toMatch(/api[_-]?key|secret|token/i);
    expect(json.settings.revision).toBe(1);
  });

  it('PUT rejects unknown provider', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
    const res = await PUT(
      new NextRequest('http://localhost/api/admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          provider: 'gemini',
          model: 'x',
          expectedRevision: null,
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('PUT saves and returns fresh view', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
    vi.mocked(saveAiRuntimeSettings).mockResolvedValue({ ...sampleView, revision: 2 });
    const res = await PUT(
      new NextRequest('http://localhost/api/admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: 1,
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.settings.revision).toBe(2);
    expect(saveAiRuntimeSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        expectedRevision: 1,
        updatedBy: 'prof@test.edu',
      }),
    );
  });

  it('PUT returns 409 on stale revision', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
    vi.mocked(saveAiRuntimeSettings).mockRejectedValue(new AiRuntimeSettingsConflictError());
    const res = await PUT(
      new NextRequest('http://localhost/api/admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: 1,
        }),
      }),
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.message).toContain('another session');
  });

  it('PUT validation errors surface sanitized 400', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
    vi.mocked(saveAiRuntimeSettings).mockRejectedValue(
      new AiRuntimeSettingsValidationError('Selected provider is not available.'),
    );
    const res = await PUT(
      new NextRequest('http://localhost/api/admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: null,
        }),
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe('Selected provider is not available.');
  });

  it('PUT does not leak unexpected internal error messages', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
    vi.mocked(saveAiRuntimeSettings).mockRejectedValue(new Error('database password leaked'));
    const res = await PUT(
      new NextRequest('http://localhost/api/admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: false,
          provider: 'groq',
          model: null,
          expectedRevision: null,
        }),
      }),
    );
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.message).toBe('Internal server error');
    expect(JSON.stringify(json)).not.toContain('database password leaked');
    expect(internalErrorResponse).toHaveBeenCalled();
  });

  it('PUT accepts disabled save with null model', async () => {
    vi.mocked(requireFullAdminAccessForContent).mockResolvedValue(null);
    vi.mocked(saveAiRuntimeSettings).mockResolvedValue({ ...sampleView, enabled: false, savedEnabled: false });
    const res = await PUT(
      new NextRequest('http://localhost/api/admin/ai/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: false,
          provider: 'groq',
          model: null,
          expectedRevision: null,
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(saveAiRuntimeSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        model: null,
      }),
    );
  });
});
