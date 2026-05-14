import 'server-only';

import type { ContentVersion, Prisma } from '@prisma/client';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { validateSiteContent } from '@/content/validators';
import { recordContentEvent } from '@/server/content/contentEvents';
import {
  ContentWorkflowError,
  WORKING_DRAFT_SLOT,
  getWorkingDraft,
} from '@/server/content/contentWorkflowCore';
import { prisma } from '@/server/db/prisma';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import { getContentImportDetail, updateImportStatus } from '@/server/imports/repository';
import { DetailsSchema } from '@/validators/detailsSchema';

function toJsonPayload(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

export class ImportMergeError extends Error {
  constructor(
    readonly code: 'IMPORT_NOT_FOUND' | 'NO_CANDIDATE' | 'INVALID_CANDIDATE' | 'MERGE_VALIDATION_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ImportMergeError';
  }
}

type ImportDetailRow = NonNullable<Awaited<ReturnType<typeof getContentImportDetail>>>;

async function loadDetailsFromImportRow(row: ImportDetailRow) {
  if (row.status === 'FAILED' || !row.candidatePayload) {
    throw new ImportMergeError('NO_CANDIDATE', 'This import has no mergeable candidate payload.');
  }
  if (row.status === 'REJECTED') {
    throw new ImportMergeError('NO_CANDIDATE', 'This import was already finalized and cannot merge again.');
  }
  const parsed = DetailsSchema.safeParse(row.candidatePayload);
  if (!parsed.success) {
    throw new ImportMergeError('INVALID_CANDIDATE', 'Stored candidate is not valid Details JSON.');
  }
  return { importRow: row, details: parsed.data };
}

export type MergeImportCandidateResult = {
  version: ContentVersion;
  alreadyMerged: boolean;
};

/**
 * Creates a working draft from the import candidate, or replaces the existing draft payload.
 * Never touches published rows. Sets `ContentVersion.importId` and marks the import `MERGED`.
 */
export async function mergeImportCandidateToWorkingDraft(input: {
  importId: string;
  action: 'create' | 'replace';
  changeSummary?: string | null;
}): Promise<MergeImportCandidateResult> {
  const quick = await getContentImportDetail(input.importId);
  if (!quick) {
    throw new ImportMergeError('IMPORT_NOT_FOUND', 'Import not found.');
  }

  if (quick.status === 'MERGED') {
    const working = await prisma.contentVersion.findFirst({
      where: { importId: input.importId, draftSlot: WORKING_DRAFT_SLOT, status: 'DRAFT' },
    });
    if (working) {
      return { version: working, alreadyMerged: true };
    }
    const anyVersion = await prisma.contentVersion.findFirst({
      where: { importId: input.importId },
      orderBy: { updatedAt: 'desc' },
    });
    if (anyVersion) {
      return { version: anyVersion, alreadyMerged: true };
    }
    throw new ImportMergeError(
      'NO_CANDIDATE',
      'This import was merged but no linked content version was found.',
    );
  }

  const { importRow, details } = await loadDetailsFromImportRow(quick);
  const baselineParsed = validateSiteContent(SITE_CONTENT_RAW);
  if (!baselineParsed.success) {
    throw new ImportMergeError('MERGE_VALIDATION_FAILED', 'Canonical baseline failed validation.');
  }
  const working = await getWorkingDraft();
  const basePayload = working ? validateSiteContent(working.payload) : baselineParsed;
  if (!basePayload.success) {
    throw new ImportMergeError('MERGE_VALIDATION_FAILED', 'Working draft payload is invalid.');
  }
  const merged = mergeCvDetailsIntoSiteContent(details, basePayload.data);
  const validated = validateSiteContent(merged);
  if (!validated.success) {
    throw new ImportMergeError(
      'MERGE_VALIDATION_FAILED',
      `Merged SiteContent failed validation: ${validated.error.message}`,
    );
  }

  if (input.action === 'create') {
    if (working) {
      throw new ContentWorkflowError(
        'DRAFT_EXISTS',
        'A working draft already exists. Use replace, or publish/discard the draft first.',
      );
    }
    const row = await prisma.contentVersion.create({
      data: {
        status: 'DRAFT',
        draftSlot: WORKING_DRAFT_SLOT,
        importId: input.importId,
        payload: toJsonPayload(validated.data),
        label: `Draft from import ${input.importId.slice(0, 8)}…`,
        changeSummary: input.changeSummary ?? `Merged from import ${importRow.uploadedFile.originalName}`,
        createdBy: null,
      },
    });
    await recordContentEvent({
      eventType: 'WORKING_DRAFT_CREATED',
      versionId: row.id,
      payload: { importId: input.importId, source: 'import_candidate' },
    });
    await recordContentEvent({
      eventType: 'SYSTEM_NOTE',
      versionId: row.id,
      payload: { kind: 'IMPORT_MERGED_TO_WORKING_DRAFT', importId: input.importId, action: 'create' },
    });
    await updateImportStatus(input.importId, 'MERGED');
    return { version: row, alreadyMerged: false };
  }

  if (!working) {
    throw new ContentWorkflowError('NO_DRAFT', 'No working draft to replace.');
  }
  const row = await prisma.contentVersion.update({
    where: { id: working.id },
    data: {
      payload: toJsonPayload(validated.data),
      importId: input.importId,
      changeSummary: input.changeSummary ?? working.changeSummary,
    },
  });
  await recordContentEvent({
    eventType: 'WORKING_DRAFT_UPDATED',
    versionId: row.id,
    payload: { importId: input.importId, source: 'import_candidate_replace' },
  });
  await recordContentEvent({
    eventType: 'SYSTEM_NOTE',
    versionId: row.id,
    payload: { kind: 'IMPORT_MERGED_TO_WORKING_DRAFT', importId: input.importId, action: 'replace' },
  });
  await updateImportStatus(input.importId, 'MERGED');
  return { version: row, alreadyMerged: false };
}
