/**
 * GET: AI provider configuration status (no secrets).
 */

import { NextResponse } from 'next/server';

import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import { getAiProviderSettingsView } from '@/server/ai/aiProviderSettings';

export async function GET() {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }

  try {
    return NextResponse.json({ ok: true, settings: getAiProviderSettingsView() });
  } catch (e) {
    console.error('[ai-settings]', e);
    return internalErrorResponse();
  }
}
