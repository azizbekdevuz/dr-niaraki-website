/**
 * GET: professor-facing CV change set for an import (persisted; generate once if missing).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import { prisma } from '@/server/db/prisma';
import { generateAndPersistImportChangeSet } from '@/server/imports/cvUpdate/generateAndPersistChangeSet';
import { withImportOperationTiming } from '@/server/imports/cvUpdate/instrumentation';
import {
  loadImportChangeDecisions,
  loadImportChangeSet,
} from '@/server/imports/cvUpdate/persistChangeSet';
import {
  decisionsFromEnvelope,
  toProfessorChangeSetDto,
} from '@/server/imports/cvUpdate/professorChangeSetDto';
import { CV_CHANGE_ALGORITHM_VERSION } from '@/server/imports/cvUpdate/semanticEquality';
import { ImportDomainError } from '@/server/imports/types';

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: code, message }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const denied = await requireFullAdminAccessForContent();
  if (denied) {
    return denied;
  }
  const { id } = await context.params;
  if (!id) {
    return errorResponse('BAD_REQUEST', 'Missing id', 400);
  }

  const advanced = request.nextUrl.searchParams.get('advanced') === '1';

  try {
    return await withImportOperationTiming(
      { importId: id, operation: 'import_detail_loading' },
      async () => {
        let changeSet = await loadImportChangeSet(id);
        let regenerated = false;

        const needsRegen =
          !changeSet ||
          typeof changeSet.algorithmVersion !== 'number' ||
          changeSet.algorithmVersion < CV_CHANGE_ALGORITHM_VERSION;

        if (needsRegen) {
          const row = await prisma.contentImport.findUnique({
            where: { id },
            select: { candidatePayload: true },
          });
          if (!row) {
            return errorResponse('IMPORT_NOT_FOUND', 'Import not found', 404);
          }
          if (row.candidatePayload) {
            changeSet = await generateAndPersistImportChangeSet(id);
            regenerated = true;
          }
        }

        if (!changeSet) {
          return NextResponse.json({
            ok: true,
            changeSet: null,
            decisions: null,
            message: 'No change set available yet — wait for parsing to finish.',
          });
        }

        const decisionsEnvelope = regenerated ? null : await loadImportChangeDecisions(id);
        const dto = toProfessorChangeSetDto(changeSet, advanced);

        return NextResponse.json({
          ok: true,
          changeSet: dto,
          decisions: decisionsFromEnvelope(decisionsEnvelope),
          regenerated,
          algorithmVersion: changeSet.algorithmVersion ?? null,
        });
      },
    );
  } catch (e) {
    if (e instanceof ImportDomainError) {
      return errorResponse(e.code, e.message, 404);
    }
    console.error(e);
    return internalErrorResponse();
  }
}
