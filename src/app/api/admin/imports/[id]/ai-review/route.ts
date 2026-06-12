/**
 * POST: advisory AI import review suggestions (manual, on-demand).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import { runImportAiReview } from '@/server/ai/runImportAiReview';
import { parseReviewBaselineMode } from '@/server/imports/reviewBaseline';

const bodySchema = z
  .object({
    baseline: z.enum(['auto', 'working_draft', 'canonical', 'published']).optional(),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

export const maxDuration = 30;

export async function POST(request: NextRequest, context: RouteContext) {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST', message: 'Missing id' }, { status: 400 });
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST', message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'BAD_REQUEST', message: parsed.error.message },
      { status: 400 },
    );
  }

  const baseline = parseReviewBaselineMode(parsed.data.baseline ?? 'auto');

  try {
    const outcome = await runImportAiReview(id, baseline);
    if ('notFound' in outcome && outcome.notFound) {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND', message: 'Import not found' }, { status: 404 });
    }
    if ('rateLimited' in outcome && outcome.rateLimited) {
      return NextResponse.json(
        { ok: true, advisory: true, rateLimited: true, result: outcome.result },
        { status: 429 },
      );
    }
    if ('ok' in outcome && outcome.ok) {
      return NextResponse.json({ ok: true, result: outcome.result });
    }
    return internalErrorResponse();
  } catch (e) {
    console.error('[ai-review]', e);
    return internalErrorResponse();
  }
}
