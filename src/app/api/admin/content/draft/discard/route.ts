/**
 * POST: delete the active working draft (admin only). Does not publish or alter published rows.
 */

import { NextResponse } from 'next/server';

import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse, nextResponseFromWorkflowError } from '@/server/admin/contentWorkflowHttp';
import { discardWorkingDraft } from '@/server/content/drafts';

export async function POST() {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }
  try {
    const result = await discardWorkingDraft();
    return NextResponse.json({ ok: true, discardedVersionId: result.discardedVersionId });
  } catch (e) {
    const w = nextResponseFromWorkflowError(e);
    if (w) {
      return w;
    }
    console.error(e);
    return internalErrorResponse();
  }
}
