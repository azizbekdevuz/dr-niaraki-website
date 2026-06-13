/** @vitest-environment node */

import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/server/db/prisma', () => ({
  prisma: {
    aiRuntimeSetting: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/server/content/contentEvents', () => ({
  recordContentEvent: vi.fn(),
}));

import {
  AI_RUNTIME_SETTING_ID,
  AiRuntimeSettingsConflictError,
  AiRuntimeSettingsValidationError,
  allowedModelsForProvider,
  getAiRuntimeSettingsView,
  isProviderConfigured,
  resolveEffectiveAiRuntimeSelection,
  saveAiRuntimeSettings,
  validateSaveAiRuntimeSettingsInput,
} from '@/server/ai/aiRuntimeSettings';
import { recordContentEvent } from '@/server/content/contentEvents';
import { prisma } from '@/server/db/prisma';

describe('aiRuntimeSettings', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = { ...envBackup };
    delete process.env.AI_PROVIDER;
    vi.mocked(prisma.aiRuntimeSetting.findUnique).mockReset();
    vi.mocked(prisma.$transaction).mockReset();
    vi.mocked(recordContentEvent).mockReset();
  });

  describe('resolveEffectiveAiRuntimeSelection', () => {
    it('uses env fallback when no DB row exists', async () => {
      process.env.AI_PROVIDER = 'groq';
      process.env.GROQ_API_KEY = 'gsk-test';
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue(null);

      const effective = await resolveEffectiveAiRuntimeSelection();
      expect(effective.source).toBe('environment_fallback');
      expect(effective.revision).toBeNull();
      expect(effective.enabled).toBe(true);
      expect(effective.provider).toBe('groq');
      expect(effective.model).toBe('llama-3.1-8b-instant');
      expect(effective.misconfigured).toBe(false);
    });

    it('database selection wins over env when row exists', async () => {
      process.env.AI_PROVIDER = 'none';
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue({
        id: AI_RUNTIME_SETTING_ID,
        enabled: true,
        provider: 'openai',
        model: 'gpt-4o-mini',
        revision: 2,
        updatedBy: 'admin@test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effective = await resolveEffectiveAiRuntimeSelection();
      expect(effective.source).toBe('database');
      expect(effective.revision).toBe(2);
      expect(effective.provider).toBe('openai');
      expect(effective.model).toBe('gpt-4o-mini');
    });

    it('enabled=false yields effective none regardless of stored provider', async () => {
      process.env.AI_PROVIDER = 'openai';
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue({
        id: AI_RUNTIME_SETTING_ID,
        enabled: false,
        provider: 'openai',
        model: 'gpt-4o-mini',
        revision: 1,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effective = await resolveEffectiveAiRuntimeSelection();
      expect(effective.enabled).toBe(false);
      expect(effective.provider).toBe('none');
    });

    it('falls back to env when DB read fails', async () => {
      process.env.AI_PROVIDER = 'none';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockRejectedValue(new Error('db down'));

      const effective = await resolveEffectiveAiRuntimeSelection();
      expect(effective.source).toBe('environment_fallback');
      expect(effective.enabled).toBe(false);
      expect(effective.provider).toBe('none');
    });

    it('invalid persisted provider is misconfigured without alternate provider', async () => {
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue({
        id: AI_RUNTIME_SETTING_ID,
        enabled: true,
        provider: 'not-a-provider',
        model: 'x',
        revision: 1,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effective = await resolveEffectiveAiRuntimeSelection();
      expect(effective.misconfigured).toBe(true);
      expect(effective.provider).toBe('none');
      expect(effective.enabled).toBe(true);
    });

    it('invalid persisted model is misconfigured', async () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue({
        id: AI_RUNTIME_SETTING_ID,
        enabled: true,
        provider: 'openai',
        model: 'gpt-4o',
        revision: 1,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effective = await resolveEffectiveAiRuntimeSelection();
      expect(effective.misconfigured).toBe(true);
      expect(effective.provider).toBe('openai');
    });

    it('configured persisted provider and model execute selection', async () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      process.env.OPENAI_MODEL = 'gpt-4o-mini';
      process.env.OPENAI_ALLOWED_MODELS = 'gpt-4o-mini';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue({
        id: AI_RUNTIME_SETTING_ID,
        enabled: true,
        provider: 'openai',
        model: 'gpt-4o-mini',
        revision: 1,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const effective = await resolveEffectiveAiRuntimeSelection();
      expect(effective.misconfigured).toBe(false);
      expect(effective.provider).toBe('openai');
      expect(effective.model).toBe('gpt-4o-mini');
    });
  });

  describe('isProviderConfigured', () => {
    it('is selectable when API key and allowlist exist even if env default model is invalid', () => {
      process.env.GROQ_API_KEY = 'gsk-test';
      process.env.GROQ_MODEL = 'invalid-default-model';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';

      expect(isProviderConfigured('groq')).toBe(true);
      expect(allowedModelsForProvider('groq')).toContain('llama-3.1-8b-instant');
    });
  });

  describe('validateSaveAiRuntimeSettingsInput', () => {
    it('rejects unknown provider', () => {
      expect(() =>
        validateSaveAiRuntimeSettingsInput({
          enabled: true,
          provider: 'gemini' as never,
          model: 'x',
          expectedRevision: null,
          updatedBy: null,
        }),
      ).toThrow(AiRuntimeSettingsValidationError);
    });

    it('rejects model outside allowlist when enabled', () => {
      process.env.GROQ_API_KEY = 'gsk';
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      expect(() =>
        validateSaveAiRuntimeSettingsInput({
          enabled: true,
          provider: 'groq',
          model: 'other-model',
          expectedRevision: null,
          updatedBy: null,
        }),
      ).toThrow(AiRuntimeSettingsValidationError);
    });

    it('rejects unconfigured provider when enabled', () => {
      delete process.env.GROQ_API_KEY;
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      expect(() =>
        validateSaveAiRuntimeSettingsInput({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: null,
          updatedBy: null,
        }),
      ).toThrow(AiRuntimeSettingsValidationError);
    });

    it('permits disabled save with null model and no configured providers', () => {
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.OLLAMA_BASE_URL;
      expect(() =>
        validateSaveAiRuntimeSettingsInput({
          enabled: false,
          provider: 'groq',
          model: null,
          expectedRevision: null,
          updatedBy: null,
        }),
      ).not.toThrow();
    });

    it('permits enabled save with allowlisted model when env default is invalid', () => {
      process.env.GROQ_API_KEY = 'gsk';
      process.env.GROQ_MODEL = 'invalid-default-model';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      expect(() =>
        validateSaveAiRuntimeSettingsInput({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: null,
          updatedBy: null,
        }),
      ).not.toThrow();
    });
  });

  describe('saveAiRuntimeSettings', () => {
    it('creates singleton row when expectedRevision is null', async () => {
      process.env.GROQ_API_KEY = 'gsk';
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue({
        id: AI_RUNTIME_SETTING_ID,
        enabled: true,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        revision: 1,
        updatedBy: 'admin@test',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        const tx = {
          aiRuntimeSetting: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValue({
                id: AI_RUNTIME_SETTING_ID,
                enabled: true,
                provider: 'groq',
                model: 'llama-3.1-8b-instant',
                revision: 1,
                updatedBy: 'admin@test',
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            create: vi.fn().mockResolvedValue({
              id: AI_RUNTIME_SETTING_ID,
              enabled: true,
              provider: 'groq',
              model: 'llama-3.1-8b-instant',
              revision: 1,
              updatedBy: 'admin@test',
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            updateMany: vi.fn(),
          },
        };
        return fn(tx as never);
      });

      const view = await saveAiRuntimeSettings({
        enabled: true,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        expectedRevision: null,
        updatedBy: 'admin@test',
      });
      expect(view.source).toBe('database');
      expect(view.revision).toBe(1);
      expect(recordContentEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'SYSTEM_NOTE',
          payload: expect.objectContaining({ kind: 'AI_RUNTIME_SETTINGS_UPDATED' }),
        }),
      );
    });

    it('throws conflict when atomic updateMany affects zero rows', async () => {
      process.env.GROQ_API_KEY = 'gsk';
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        const tx = {
          aiRuntimeSetting: {
            findUnique: vi.fn().mockResolvedValue({
              id: AI_RUNTIME_SETTING_ID,
              enabled: true,
              provider: 'groq',
              model: 'llama-3.1-8b-instant',
              revision: 3,
              updatedBy: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            create: vi.fn(),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return fn(tx as never);
      });

      await expect(
        saveAiRuntimeSettings({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: 1,
          updatedBy: null,
        }),
      ).rejects.toBeInstanceOf(AiRuntimeSettingsConflictError);
    });

    it('converts concurrent create unique constraint to conflict error', async () => {
      process.env.GROQ_API_KEY = 'gsk';
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      const uniqueError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      });
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        const tx = {
          aiRuntimeSetting: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(uniqueError),
            updateMany: vi.fn(),
          },
        };
        return fn(tx as never);
      });

      await expect(
        saveAiRuntimeSettings({
          enabled: true,
          provider: 'groq',
          model: 'llama-3.1-8b-instant',
          expectedRevision: null,
          updatedBy: null,
        }),
      ).rejects.toBeInstanceOf(AiRuntimeSettingsConflictError);
    });

    it('saves AI off with null model when no providers are configured', async () => {
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue({
        id: AI_RUNTIME_SETTING_ID,
        enabled: false,
        provider: 'groq',
        model: null,
        revision: 1,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
        const tx = {
          aiRuntimeSetting: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValue({
                id: AI_RUNTIME_SETTING_ID,
                enabled: false,
                provider: 'groq',
                model: null,
                revision: 1,
                updatedBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            create: vi.fn().mockResolvedValue({
              id: AI_RUNTIME_SETTING_ID,
              enabled: false,
              provider: 'groq',
              model: null,
              revision: 1,
              updatedBy: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
            updateMany: vi.fn(),
          },
        };
        return fn(tx as never);
      });

      const view = await saveAiRuntimeSettings({
        enabled: false,
        provider: 'groq',
        model: null,
        expectedRevision: null,
        updatedBy: null,
      });
      expect(view.enabled).toBe(false);
      expect(view.savedEnabled).toBe(false);
    });
  });

  describe('getAiRuntimeSettingsView', () => {
    it('does not expose secrets in provider options', async () => {
      process.env.GROQ_API_KEY = 'gsk-super-secret-key';
      process.env.GROQ_MODEL = 'llama-3.1-8b-instant';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue(null);

      const view = await getAiRuntimeSettingsView();
      const serialized = JSON.stringify(view);
      expect(serialized).not.toContain('gsk-super-secret-key');
      expect(serialized).not.toContain('API_KEY');
      expect(view.providers.every((p) => p.selectable === isProviderConfigured(p.id as never))).toBe(true);
      expect(allowedModelsForProvider('groq')).toContain('llama-3.1-8b-instant');
    });

    it('marks provider selectable when allowlist has models despite invalid env default', async () => {
      process.env.GROQ_API_KEY = 'gsk-test';
      process.env.GROQ_MODEL = 'invalid-default-model';
      process.env.GROQ_ALLOWED_MODELS = 'llama-3.1-8b-instant';
      vi.mocked(prisma.aiRuntimeSetting.findUnique).mockResolvedValue(null);

      const view = await getAiRuntimeSettingsView();
      const groq = view.providers.find((p) => p.id === 'groq');
      expect(groq?.selectable).toBe(true);
      expect(groq?.allowedModels).toContain('llama-3.1-8b-instant');
    });
  });
});
