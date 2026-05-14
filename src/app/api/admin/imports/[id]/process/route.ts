/**
 * POST: run DOCX parse + persist for an import stuck in `UPLOADED` (e.g. if `after()` did not run).
 * Same auth bar as other editorial import APIs.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { readUploadBufferByStoredPath } from '@/lib/storage';
import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import { getContentImportDetail } from '@/server/imports/repository';
import { DocxImportParseError, runDocxImportParseJob } from '@/server/imports/runDocxImportParseJob';

type RouteContext = { params: Promise<{ id: string }> };

/** Parse can exceed default serverless budget on large CVs. */
export const maxDuration = 60;

export async function POST(_request: NextRequest, context: RouteContext) {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST', message: 'Missing id' }, { status: 400 });
  }

  try {
    const row = await getContentImportDetail(id);
    if (!row) {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND', message: 'Import not found' }, { status: 404 });
    }

    if (row.status !== 'UPLOADED') {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `import_status_${row.status}`,
        importId: id,
      });
    }

    if (row.candidatePayload !== null && row.candidatePayload !== undefined) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'already_has_candidate',
        importId: id,
      });
    }

    const buffer = await readUploadBufferByStoredPath(row.uploadedFile.storedPath);
    if (!buffer) {
      return NextResponse.json(
        {
          ok: false,
          error: 'UPLOAD_BYTES_MISSING',
          message: 'Could not read stored upload bytes for this import.',
        },
        { status: 422 },
      );
    }

    try {
      const outcome = await runDocxImportParseJob({
        importId: id,
        uploadedFileId: row.uploadedFileId,
        buffer,
        originalName: row.uploadedFile.originalName,
        mimeType: row.uploadedFile.mimeType,
        uploaderLabel: null,
      });
      return NextResponse.json({
        ok: true,
        skipped: false,
        importId: id,
        status: outcome.import.status,
      });
    } catch (e) {
      if (e instanceof DocxImportParseError) {
        return NextResponse.json({
          ok: true,
          skipped: false,
          importId: id,
          status: 'FAILED',
          parseError: true,
          message: e.message,
        });
      }
      throw e;
    }
  } catch (e) {
    console.error(e);
    return internalErrorResponse();
  }
}
