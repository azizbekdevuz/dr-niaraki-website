import 'server-only';

import { Prisma } from '@prisma/client';

import { recordContentEvent } from '@/server/content/contentEvents';
import { prisma } from '@/server/db/prisma';
import type {
  CvChangeDecisionsEnvelope,
  CvChangeSet,
} from '@/server/imports/cvUpdate/changeSetTypes';
import { ImportDomainError } from '@/server/imports/types';

export class CvChangeSetError extends Error {
  constructor(
    readonly code:
      | 'IMPORT_NOT_FOUND'
      | 'CHANGE_SET_MISSING'
      | 'CHANGE_SET_REVISION_MISMATCH'
      | 'CHANGE_SET_INVALID'
      | 'CHANGE_DECISIONS_INVALID',
    message: string,
  ) {
    super(message);
    this.name = 'CvChangeSetError';
  }
}

function toJsonPayload(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

function parseCvChangeSet(input: unknown): CvChangeSet | null {
  if (!input || typeof input !== 'object') {return null;}
  const row = input as Partial<CvChangeSet>;
  if (row.schemaVersion !== 1 || typeof row.changeSetRevision !== 'string') {
    return null;
  }
  return row as CvChangeSet;
}

function parseCvChangeDecisionsEnvelope(input: unknown): CvChangeDecisionsEnvelope | null {
  if (!input || typeof input !== 'object') {return null;}
  const row = input as Partial<CvChangeDecisionsEnvelope>;
  if (row.schemaVersion !== 1 || typeof row.changeSetRevision !== 'string' || !Array.isArray(row.decisions)) {
    return null;
  }
  return row as CvChangeDecisionsEnvelope;
}

export async function loadImportChangeSet(importId: string): Promise<CvChangeSet | null> {
  const row = await prisma.contentImport.findUnique({
    where: { id: importId },
    select: { changeSet: true },
  });
  if (!row) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
  }
  return parseCvChangeSet(row.changeSet);
}

export async function loadImportChangeDecisions(
  importId: string,
): Promise<CvChangeDecisionsEnvelope | null> {
  const row = await prisma.contentImport.findUnique({
    where: { id: importId },
    select: { changeDecisions: true },
  });
  if (!row) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
  }
  return parseCvChangeDecisionsEnvelope(row.changeDecisions);
}

export async function persistImportChangeSet(
  importId: string,
  changeSet: CvChangeSet,
  options?: { invalidateDecisions?: boolean },
): Promise<void> {
  const existing = await prisma.contentImport.findUnique({
    where: { id: importId },
    select: { changeSet: true },
  });
  if (!existing) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
  }
  const existingParsed = parseCvChangeSet(existing.changeSet);
  const existingRevision = existingParsed?.changeSetRevision ?? null;
  const existingAlgo =
    typeof existingParsed?.algorithmVersion === 'number' ? existingParsed.algorithmVersion : 0;
  const nextAlgo =
    typeof changeSet.algorithmVersion === 'number' ? changeSet.algorithmVersion : 0;

  const revisionChanged =
    existingRevision !== null && existingRevision !== changeSet.changeSetRevision;
  const algorithmUpgraded = existingParsed !== null && existingAlgo < nextAlgo;
  const invalidateDecisions =
    Boolean(options?.invalidateDecisions) || revisionChanged || algorithmUpgraded;

  try {
    await prisma.contentImport.update({
      where: { id: importId },
      data: {
        changeSet: toJsonPayload(changeSet),
        ...(invalidateDecisions ? { changeDecisions: Prisma.JsonNull } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
    }
    throw e;
  }

  await recordContentEvent({
    eventType: 'CV_CHANGE_SET_GENERATED',
    payload: {
      importId,
      changeSetRevision: changeSet.changeSetRevision,
      totalChanges: changeSet.summary.totalChanges,
      safelyPrepared: changeSet.summary.safelyPrepared,
      requiresReview: changeSet.summary.requiresReview,
      unchangedItemCount: changeSet.summary.unchangedItemCount,
      itemCount: changeSet.items.length,
      unknownSectionCount: changeSet.unknownSections.length,
    },
  });
}

export async function persistImportChangeDecisions(
  importId: string,
  envelope: CvChangeDecisionsEnvelope,
): Promise<void> {
  const row = await prisma.contentImport.findUnique({
    where: { id: importId },
    select: { changeSet: true, changeDecisions: true },
  });
  if (!row) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
  }

  const changeSet = parseCvChangeSet(row.changeSet);
  if (!changeSet) {
    throw new CvChangeSetError('CHANGE_SET_MISSING', 'Import has no persisted change set.');
  }

  if (envelope.changeSetRevision !== changeSet.changeSetRevision) {
    throw new CvChangeSetError(
      'CHANGE_SET_REVISION_MISMATCH',
      'Change decisions do not match the current change set revision.',
    );
  }

  if (envelope.schemaVersion !== 1 || !Array.isArray(envelope.decisions)) {
    throw new CvChangeSetError('CHANGE_DECISIONS_INVALID', 'Change decisions envelope is invalid.');
  }

  try {
    await prisma.contentImport.update({
      where: { id: importId },
      data: { changeDecisions: toJsonPayload(envelope) },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
    }
    throw e;
  }
}

export { parseCvChangeSet, parseCvChangeDecisionsEnvelope };
