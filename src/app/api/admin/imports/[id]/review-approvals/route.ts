/**
 * POST: persist explicit candidate reconciliation approvals for an import.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import { CandidateReviewApprovalError } from '@/server/imports/candidateReviewValidate';
import { ImportReviewReconcileError } from '@/server/imports/importCandidateReview/reconcile';
import {
  ImportReviewApprovalPersistError,
  saveImportReviewApprovals,
} from '@/server/imports/importCandidateReview/service';
import { candidateReviewApprovalSchema } from '@/server/imports/importCandidateReview/storageSchema';

const bodySchema = z
  .object({
    manifestRevision: z.string().min(8),
    approvals: z.array(candidateReviewApprovalSchema),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

function persistErrorStatus(code: ImportReviewApprovalPersistError['code']): number {
  if (code === 'IMPORT_NOT_FOUND') {
    return 404;
  }
  if (code === 'REVIEW_MANIFEST_STALE' || code === 'CONCURRENT_UPDATE') {
    return 409;
  }
  return 422;
}

function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json({ ok: false, error: code, message }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }
  const { id } = await context.params;
  if (!id) {
    return errorResponse('BAD_REQUEST', 'Missing id', 400);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse('BAD_REQUEST', parsed.error.message, 400);
  }
  try {
    const reviewState = await saveImportReviewApprovals({
      importId: id,
      manifestRevision: parsed.data.manifestRevision,
      approvals: parsed.data.approvals,
    });
    return NextResponse.json({ ok: true, candidateReconcileReview: reviewState });
  } catch (e) {
    if (e instanceof ImportReviewApprovalPersistError) {
      return errorResponse(e.code, e.message, persistErrorStatus(e.code));
    }
    if (e instanceof CandidateReviewApprovalError) {
      return errorResponse('REVIEW_APPROVALS_INVALID', e.message, 422);
    }
    if (e instanceof ImportReviewReconcileError) {
      return errorResponse(e.code, e.message, 422);
    }
    console.error(e);
    return internalErrorResponse();
  }
}
