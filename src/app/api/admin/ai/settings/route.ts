/**
 * GET/PUT: AI runtime settings (non-secret selection only).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import {
  AiRuntimeSettingsConflictError,
  AiRuntimeSettingsValidationError,
  getAiRuntimeSettingsView,
  isSelectableProviderId,
  resolveAdminActorEmail,
  saveAiRuntimeSettings,
} from '@/server/ai/aiRuntimeSettings';

const putBodySchema = z
  .object({
    enabled: z.boolean(),
    provider: z.enum(['ollama', 'openrouter', 'groq', 'openai']),
    model: z.string().min(1).nullable(),
    expectedRevision: z.number().int().nullable(),
  })
  .strict();

export async function GET() {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }

  try {
    const settings = await getAiRuntimeSettingsView();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    console.error('[ai-settings]', e);
    return internalErrorResponse();
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST', message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = putBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'BAD_REQUEST', message: parsed.error.message },
      { status: 400 },
    );
  }

  if (!isSelectableProviderId(parsed.data.provider)) {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST', message: 'Unknown provider.' }, { status: 400 });
  }

  try {
    const updatedBy = await resolveAdminActorEmail();
    const settings = await saveAiRuntimeSettings({
      enabled: parsed.data.enabled,
      provider: parsed.data.provider,
      model: parsed.data.model,
      expectedRevision: parsed.data.expectedRevision,
      updatedBy,
    });
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    if (e instanceof AiRuntimeSettingsConflictError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'CONFLICT',
          message: 'These settings changed in another session. Reload the latest settings.',
        },
        { status: 409 },
      );
    }
    if (e instanceof AiRuntimeSettingsValidationError) {
      return NextResponse.json({ ok: false, error: 'BAD_REQUEST', message: e.message }, { status: 400 });
    }
    console.error('[ai-settings]', e);
    return internalErrorResponse();
  }
}
