import 'server-only';

import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';

import { hashSessionCookieOpaque, isOpaqueSessionCookieValue } from '@/server/admin/adminSession';
import { getAiReviewRuntimeConfig, resolveAllowlistedModel } from '@/server/ai/aiReviewConfig';
import type {
  AiProviderId,
  AiProviderOptionView,
  AiProviderSettingsView,
  AiProviderStatus,
  AiSelectableProviderId,
} from '@/server/ai/aiReviewTypes';
import { AI_REVIEW_DISCLAIMERS } from '@/server/ai/aiReviewTypes';
import { prisma } from '@/server/db/prisma';

export const AI_RUNTIME_SETTING_ID = 'main';

const SELECTABLE_PROVIDERS: AiSelectableProviderId[] = ['ollama', 'openrouter', 'groq', 'openai'];

const FRIENDLY_LABELS: Record<AiSelectableProviderId, string> = {
  ollama: 'Ollama - Private/self-hosted',
  groq: 'Groq - Hosted, fast',
  openrouter: 'OpenRouter - Hosted model gateway',
  openai: 'OpenAI - Hosted, paid',
};

export type AiRuntimeSettingsSource = 'database' | 'environment_fallback' | 'database_error';

export type EffectiveAiRuntimeSelection = {
  enabled: boolean;
  provider: AiProviderId;
  model: string | null;
  source: AiRuntimeSettingsSource;
  revision: number | null;
  misconfigured: boolean;
  misconfiguredMessage?: string;
  settingsUnavailable?: boolean;
};

export type SaveAiRuntimeSettingsInput = {
  enabled: boolean;
  provider: AiSelectableProviderId;
  model: string | null;
  expectedRevision: number | null;
  updatedBy: string | null;
};

export class AiRuntimeSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiRuntimeSettingsValidationError';
  }
}

export class AiRuntimeSettingsConflictError extends Error {
  constructor() {
    super('AI runtime settings were updated in another session.');
    this.name = 'AiRuntimeSettingsConflictError';
  }
}

export function isSelectableProviderId(value: string): value is AiSelectableProviderId {
  return SELECTABLE_PROVIDERS.includes(value as AiSelectableProviderId);
}

export function isProviderConfigured(id: AiSelectableProviderId): boolean {
  const cfg = getAiReviewRuntimeConfig();
  switch (id) {
    case 'ollama':
      return Boolean(cfg.ollama.baseUrl?.trim()) && cfg.ollama.allowedModels.length > 0;
    case 'openrouter':
      return Boolean(cfg.openrouter.apiKey) && cfg.openrouter.allowedModels.length > 0;
    case 'groq':
      return Boolean(cfg.groq.apiKey) && cfg.groq.allowedModels.length > 0;
    case 'openai':
      return Boolean(cfg.openai.apiKey) && cfg.openai.allowedModels.length > 0;
    default:
      return false;
  }
}

export function allowedModelsForProvider(id: AiSelectableProviderId): string[] {
  const cfg = getAiReviewRuntimeConfig();
  switch (id) {
    case 'ollama':
      return cfg.ollama.allowedModels;
    case 'openrouter':
      return cfg.openrouter.allowedModels;
    case 'groq':
      return cfg.groq.allowedModels;
    case 'openai':
      return cfg.openai.allowedModels;
    default:
      return [];
  }
}

export function resolveEnvDefaultModel(provider: AiProviderId): string | null {
  const cfg = getAiReviewRuntimeConfig();
  if (provider === 'ollama') {
    return resolveAllowlistedModel(cfg.ollama.model, cfg.ollama.allowedModels);
  }
  if (provider === 'openrouter') {
    return resolveAllowlistedModel(cfg.openrouter.model, cfg.openrouter.allowedModels);
  }
  if (provider === 'groq') {
    return resolveAllowlistedModel(cfg.groq.model, cfg.groq.allowedModels);
  }
  if (provider === 'openai') {
    return resolveAllowlistedModel(cfg.openai.model, cfg.openai.allowedModels);
  }
  return null;
}

function getDatabaseErrorEffectiveSelection(): EffectiveAiRuntimeSelection {
  return {
    enabled: false,
    provider: 'none',
    model: null,
    source: 'database_error',
    revision: null,
    misconfigured: true,
    settingsUnavailable: true,
    misconfiguredMessage: 'Provider status is currently unavailable.',
  };
}

function getEnvEffectiveSelection(): EffectiveAiRuntimeSelection {
  const cfg = getAiReviewRuntimeConfig();
  const envProvider = cfg.provider;
  const enabled = envProvider !== 'none';
  return {
    enabled,
    provider: enabled ? envProvider : 'none',
    model: enabled ? resolveEnvDefaultModel(envProvider) : null,
    source: 'environment_fallback',
    revision: null,
    misconfigured: false,
  };
}

function validatePersistedExecution(
  provider: AiSelectableProviderId,
  model: string | null,
): Pick<EffectiveAiRuntimeSelection, 'misconfigured' | 'misconfiguredMessage' | 'model'> {
  if (!isProviderConfigured(provider)) {
    return {
      model,
      misconfigured: true,
      misconfiguredMessage: 'The selected AI provider is currently unavailable. Check AI settings.',
    };
  }
  const allowed = allowedModelsForProvider(provider);
  const resolved = model ? resolveAllowlistedModel(model, allowed) : null;
  if (!resolved) {
    return {
      model,
      misconfigured: true,
      misconfiguredMessage: 'The selected AI model is not approved. Check AI settings.',
    };
  }
  return { model: resolved, misconfigured: false };
}

async function readPersistedRow() {
  return prisma.aiRuntimeSetting.findUnique({ where: { id: AI_RUNTIME_SETTING_ID } });
}

function mapPersistedRow(row: {
  enabled: boolean;
  provider: string;
  model: string | null;
  revision: number;
}): EffectiveAiRuntimeSelection {
  if (!row.enabled) {
    return {
      enabled: false,
      provider: 'none',
      model: row.model,
      source: 'database',
      revision: row.revision,
      misconfigured: false,
    };
  }

  if (!isSelectableProviderId(row.provider)) {
    return {
      enabled: true,
      provider: 'none',
      model: row.model,
      source: 'database',
      revision: row.revision,
      misconfigured: true,
      misconfiguredMessage: 'The selected AI provider is invalid. Check AI settings.',
    };
  }

  const validation = validatePersistedExecution(row.provider, row.model);
  return {
    enabled: true,
    provider: row.provider,
    model: validation.model,
    source: 'database',
    revision: row.revision,
    misconfigured: validation.misconfigured,
    misconfiguredMessage: validation.misconfiguredMessage,
  };
}

export async function resolveEffectiveAiRuntimeSelection(): Promise<EffectiveAiRuntimeSelection> {
  try {
    const row = await readPersistedRow();
    if (!row) {
      return getEnvEffectiveSelection();
    }
    return mapPersistedRow(row);
  } catch (e) {
    console.error('[ai-runtime-settings] read failed; disabling AI execution', e);
    return getDatabaseErrorEffectiveSelection();
  }
}

function providerStatus(_id: AiSelectableProviderId, configured: boolean): AiProviderStatus {
  return configured ? 'configured' : 'misconfigured';
}

function buildProviderOption(
  id: AiSelectableProviderId,
  active: boolean,
  activeModel: string | null,
): AiProviderOptionView {
  const configured = isProviderConfigured(id);
  const allowedModels = allowedModelsForProvider(id);
  return {
    id,
    label: FRIENDLY_LABELS[id],
    status: providerStatus(id, configured),
    active,
    selectable: configured,
    model: active && activeModel ? activeModel : null,
    allowedModels,
    statusMessage: configured ? 'Available' : 'Not available - setup is incomplete.',
  };
}

function resolveDefaultSelectableProvider(): AiSelectableProviderId {
  const env = getEnvEffectiveSelection();
  if (env.provider !== 'none' && isSelectableProviderId(env.provider)) {
    return env.provider;
  }
  const configured = SELECTABLE_PROVIDERS.find((id) => isProviderConfigured(id));
  return configured ?? 'groq';
}

function resolveSavedFormSelection(row: Awaited<ReturnType<typeof readPersistedRow>>): {
  savedEnabled: boolean;
  savedProvider: AiSelectableProviderId;
  savedModel: string | null;
} {
  const env = getEnvEffectiveSelection();
  if (!row) {
    const provider =
      env.provider !== 'none' && isSelectableProviderId(env.provider)
        ? env.provider
        : resolveDefaultSelectableProvider();
    const allowed = allowedModelsForProvider(provider);
    const model =
      env.model ?? (allowed[0] ? resolveAllowlistedModel(allowed[0], allowed) : null) ?? allowed[0] ?? null;
    return {
      savedEnabled: env.enabled,
      savedProvider: provider,
      savedModel: model,
    };
  }
  const provider = isSelectableProviderId(row.provider) ? row.provider : resolveDefaultSelectableProvider();
  const allowed = allowedModelsForProvider(provider);
  const model =
    row.model && resolveAllowlistedModel(row.model, allowed)
      ? row.model
      : resolveEnvDefaultModel(provider) ?? allowed[0] ?? null;
  return {
    savedEnabled: row.enabled,
    savedProvider: provider,
    savedModel: model,
  };
}

function resolveDisplayActiveProvider(
  effective: EffectiveAiRuntimeSelection,
  row: Awaited<ReturnType<typeof readPersistedRow>>,
): AiProviderId {
  if (effective.misconfigured && row && isSelectableProviderId(row.provider)) {
    return row.provider;
  }
  return effective.provider;
}

function getSettingsUnavailableView(): AiProviderSettingsView {
  const providers = SELECTABLE_PROVIDERS.map((id) => buildProviderOption(id, false, null));
  return {
    enabled: false,
    activeProvider: 'none',
    activeModel: null,
    source: 'database_error',
    revision: null,
    savedEnabled: false,
    savedProvider: resolveDefaultSelectableProvider(),
    savedModel: null,
    switchingMode: 'runtime_database',
    switchingNote: 'AI settings are temporarily unavailable.',
    settingsUnavailable: true,
    providers,
    disclaimers: [...AI_REVIEW_DISCLAIMERS],
  };
}

export async function getAiRuntimeSettingsView(): Promise<AiProviderSettingsView> {
  let row: Awaited<ReturnType<typeof readPersistedRow>> = null;
  try {
    row = await readPersistedRow();
  } catch (e) {
    console.error('[ai-runtime-settings] view read failed; settings unavailable', e);
    return getSettingsUnavailableView();
  }
  const effective = row ? mapPersistedRow(row) : getEnvEffectiveSelection();
  const displayProvider = resolveDisplayActiveProvider(effective, row);
  const activeModel =
    displayProvider === effective.provider ? effective.model : row?.model ?? effective.model;
  const saved = resolveSavedFormSelection(row);

  const providers: AiProviderOptionView[] = SELECTABLE_PROVIDERS.map((id) =>
    buildProviderOption(id, displayProvider === id, displayProvider === id ? activeModel : null),
  );

  const switchingNote =
    effective.source === 'database'
      ? 'Your saved choices control AI review. Provider connection details are configured by the site administrator.'
      : 'Using administrator default settings until you save your first preference here.';

  return {
    enabled: effective.enabled,
    activeProvider: displayProvider,
    activeModel,
    source: effective.source,
    revision: effective.revision,
    savedEnabled: saved.savedEnabled,
    savedProvider: saved.savedProvider,
    savedModel: saved.savedModel,
    switchingMode: 'runtime_database',
    switchingNote,
    providers,
    disclaimers: [...AI_REVIEW_DISCLAIMERS],
  };
}

export function validateSaveAiRuntimeSettingsInput(input: SaveAiRuntimeSettingsInput): void {
  if (!isSelectableProviderId(input.provider)) {
    throw new AiRuntimeSettingsValidationError('Unknown provider.');
  }
  if (!input.enabled) {
    return;
  }
  if (!isProviderConfigured(input.provider)) {
    throw new AiRuntimeSettingsValidationError('Selected provider is not available.');
  }
  const allowed = allowedModelsForProvider(input.provider);
  if (!input.model || !resolveAllowlistedModel(input.model, allowed)) {
    throw new AiRuntimeSettingsValidationError('Model is not in the approved list for this provider.');
  }
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

type AuditPreviousSnapshot = {
  enabled: boolean;
  provider: string;
  model: string | null;
};

function resolveAuditPreviousSnapshot(
  existing: Awaited<ReturnType<typeof readPersistedRow>>,
): AuditPreviousSnapshot {
  if (existing) {
    return {
      enabled: existing.enabled,
      provider: existing.provider,
      model: existing.model,
    };
  }
  const env = getEnvEffectiveSelection();
  return {
    enabled: env.enabled,
    provider:
      env.provider !== 'none' && isSelectableProviderId(env.provider)
        ? env.provider
        : resolveDefaultSelectableProvider(),
    model: env.model,
  };
}

async function persistAiRuntimeSettingsInTransaction(
  input: SaveAiRuntimeSettingsInput,
): Promise<{ saved: NonNullable<Awaited<ReturnType<typeof readPersistedRow>>>; previous: AuditPreviousSnapshot }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.aiRuntimeSetting.findUnique({ where: { id: AI_RUNTIME_SETTING_ID } });
    const previous = resolveAuditPreviousSnapshot(existing);

    if (existing) {
      if (input.expectedRevision === null) {
        throw new AiRuntimeSettingsConflictError();
      }
      const updated = await tx.aiRuntimeSetting.updateMany({
        where: { id: AI_RUNTIME_SETTING_ID, revision: input.expectedRevision },
        data: {
          enabled: input.enabled,
          provider: input.provider,
          model: input.model,
          updatedBy: input.updatedBy,
          revision: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new AiRuntimeSettingsConflictError();
      }
      const saved = await tx.aiRuntimeSetting.findUnique({ where: { id: AI_RUNTIME_SETTING_ID } });
      if (!saved) {
        throw new AiRuntimeSettingsConflictError();
      }
      return { saved, previous };
    }

    if (input.expectedRevision !== null) {
      throw new AiRuntimeSettingsConflictError();
    }

    try {
      const saved = await tx.aiRuntimeSetting.create({
        data: {
          id: AI_RUNTIME_SETTING_ID,
          enabled: input.enabled,
          provider: input.provider,
          model: input.model,
          revision: 1,
          updatedBy: input.updatedBy,
        },
      });
      return { saved, previous };
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new AiRuntimeSettingsConflictError();
      }
      throw error;
    }
  });
}

export async function resolveAdminActorEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('admin_session')?.value;
    if (!sessionValue || !isOpaqueSessionCookieValue(sessionValue)) {
      return process.env.ADMIN_EMAIL?.trim() || null;
    }
    const tokenHash = hashSessionCookieOpaque(sessionValue);
    const session = await prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { adminUser: { select: { email: true } } },
    });
    return session?.adminUser.email ?? process.env.ADMIN_EMAIL?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function saveAiRuntimeSettings(input: SaveAiRuntimeSettingsInput): Promise<AiProviderSettingsView> {
  validateSaveAiRuntimeSettingsInput(input);

  const { saved, previous } = await persistAiRuntimeSettingsInTransaction(input);

  const { recordContentEvent } = await import('@/server/content/contentEvents');
  try {
    await recordContentEvent({
      eventType: 'SYSTEM_NOTE',
      payload: {
        kind: 'AI_RUNTIME_SETTINGS_UPDATED',
        previousEnabled: previous.enabled,
        nextEnabled: saved.enabled,
        previousProvider: previous.provider,
        nextProvider: saved.provider,
        previousModel: previous.model,
        nextModel: saved.model ?? null,
        revision: saved.revision,
      },
    });
  } catch (e) {
    console.warn('[ai-runtime-settings] audit log failed', e);
  }

  return getAiRuntimeSettingsView();
}

export type { AiSelectableProviderId } from '@/server/ai/aiReviewTypes';
