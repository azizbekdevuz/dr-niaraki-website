/**
 * POST: persist professor CV change decisions (bulk) and related locks/mappings.
 */

import type { CvDynamicSectionPresentation } from '@prisma/client';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { requireFullAdminAccessForContent } from '@/server/admin/contentWorkflowAccess';
import { internalErrorResponse } from '@/server/admin/contentWorkflowHttp';
import { CvChangeDecisionSchema } from '@/server/imports/cvUpdate/changeSetSchema';
import type { CvChangeDecision, CvChangeSet } from '@/server/imports/cvUpdate/changeSetTypes';
import { upsertImportFieldLock } from '@/server/imports/cvUpdate/fieldLocks';
import { withImportOperationTiming } from '@/server/imports/cvUpdate/instrumentation';
import {
  CvChangeSetError,
  loadImportChangeSet,
  persistImportChangeDecisions,
} from '@/server/imports/cvUpdate/persistChangeSet';
import {
  decisionsFromEnvelope,
  toProfessorChangeSetDto,
} from '@/server/imports/cvUpdate/professorChangeSetDto';
import { upsertCvSectionMapping } from '@/server/imports/cvUpdate/sectionMappings';
import { ImportDomainError } from '@/server/imports/types';

const PRESENTATIONS = new Set<string>([
  'RICH_TEXT',
  'BULLET_LIST',
  'TIMELINE',
  'GROUPED_CARDS',
  'KEY_VALUE',
  'KEEP_IN_CV',
  'IGNORE',
]);

const bodySchema = z
  .object({
    changeSetRevision: z.string().min(8),
    decisions: z.array(CvChangeDecisionSchema),
  })
  .strict();

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: code, message }, { status });
}

function persistErrorStatus(code: CvChangeSetError['code']): number {
  if (code === 'IMPORT_NOT_FOUND' || code === 'CHANGE_SET_MISSING') {return 404;}
  if (code === 'CHANGE_SET_REVISION_MISMATCH') {return 409;}
  return 422;
}

function presentationFromEdited(value: unknown): CvDynamicSectionPresentation | null {
  if (!value || typeof value !== 'object') {return null;}
  const row = value as { presentation?: unknown };
  if (typeof row.presentation !== 'string' || !PRESENTATIONS.has(row.presentation)) {
    return null;
  }
  return row.presentation as CvDynamicSectionPresentation;
}

function displayTitleFromEdited(value: unknown): string | null | undefined {
  if (!value || typeof value !== 'object') {return undefined;}
  const row = value as { displayTitle?: unknown; title?: unknown };
  if (typeof row.displayTitle === 'string') {return row.displayTitle;}
  if (typeof row.title === 'string') {return row.title;}
  return undefined;
}

function sourceTitleForMapping(item: CvChangeSet['items'][number], decision: CvChangeDecision): string {
  const edited = decision.editedValue;
  if (edited && typeof edited === 'object') {
    const row = edited as { sourceTitle?: unknown };
    if (typeof row.sourceTitle === 'string' && row.sourceTitle.trim()) {
      return row.sourceTitle.trim();
    }
  }
  if (typeof item.candidateValue === 'object' && item.candidateValue) {
    const row = item.candidateValue as { sourceTitle?: unknown; title?: unknown };
    if (typeof row.sourceTitle === 'string' && row.sourceTitle.trim()) {return row.sourceTitle.trim();}
    if (typeof row.title === 'string' && row.title.trim()) {return row.title.trim();}
  }
  return item.label;
}

async function applyDecisionSideEffects(
  changeSet: CvChangeSet,
  decisions: CvChangeDecision[],
): Promise<void> {
  const byId = new Map(changeSet.items.map((item) => [item.id, item]));

  for (const decision of decisions) {
    const item = byId.get(decision.changeId);
    if (!item) {continue;}

    const shouldLock =
      decision.action === 'lock_website' ||
      (decision.action === 'keep_website' && decision.lockForFutureImports === true);

    if (shouldLock) {
      await upsertImportFieldLock({
        fieldPath: item.fieldPath,
        lockedWebsiteValue: item.websiteValue ?? null,
        rejectedSourceValue: item.candidateValue,
        reason:
          decision.action === 'lock_website'
            ? 'Professor locked website value'
            : 'Professor kept website value for future imports',
      });
    }

    if (decision.action === 'accept') {
      const presentation = presentationFromEdited(decision.editedValue);
      if (
        presentation &&
        (item.sectionKey === 'unknown_section' || item.kind === 'new_section')
      ) {
        await upsertCvSectionMapping({
          sourceTitle: sourceTitleForMapping(item, decision),
          presentation,
          displayTitle: displayTitleFromEdited(decision.editedValue),
        });
      }
    }
  }
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
    return await withImportOperationTiming(
      {
        importId: id,
        operation: 'change_decision_persistence',
        counts: { decisionCount: parsed.data.decisions.length },
      },
      async () => {
        const changeSet = await loadImportChangeSet(id);
        if (!changeSet) {
          throw new CvChangeSetError('CHANGE_SET_MISSING', 'Import has no persisted change set.');
        }

        const envelope = {
          schemaVersion: 1 as const,
          changeSetRevision: parsed.data.changeSetRevision,
          savedAt: new Date().toISOString(),
          decisions: parsed.data.decisions,
        };

        await persistImportChangeDecisions(id, envelope);
        await applyDecisionSideEffects(changeSet, parsed.data.decisions);

        return NextResponse.json({
          ok: true,
          changeSet: toProfessorChangeSetDto(changeSet, false),
          decisions: decisionsFromEnvelope(envelope),
        });
      },
    );
  } catch (e) {
    if (e instanceof CvChangeSetError) {
      return errorResponse(e.code, e.message, persistErrorStatus(e.code));
    }
    if (e instanceof ImportDomainError) {
      return errorResponse(e.code, e.message, 404);
    }
    console.error(e);
    return internalErrorResponse();
  }
}
