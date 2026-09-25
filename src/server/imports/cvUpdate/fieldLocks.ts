import 'server-only';

import type { ImportFieldLock, Prisma } from '@prisma/client';

import { recordContentEvent } from '@/server/content/contentEvents';
import { prisma } from '@/server/db/prisma';
import { fingerprintText } from '@/server/imports/cvUpdate/truncationDetect';

function toJsonPayload(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

export async function listImportFieldLocks(): Promise<ImportFieldLock[]> {
  return prisma.importFieldLock.findMany({
    orderBy: { fieldPath: 'asc' },
  });
}

export async function upsertImportFieldLock(input: {
  fieldPath: string;
  lockedWebsiteValue: unknown;
  rejectedSourceValue?: unknown;
  reason?: string;
}): Promise<ImportFieldLock> {
  const lockedWebsiteFingerprint = fingerprintText(input.lockedWebsiteValue);
  const rejectedSourceFingerprint =
    input.rejectedSourceValue !== undefined ? fingerprintText(input.rejectedSourceValue) : null;

  const lock = await prisma.importFieldLock.upsert({
    where: { fieldPath: input.fieldPath },
    create: {
      fieldPath: input.fieldPath,
      lockedWebsiteFingerprint,
      lockedWebsiteValue: toJsonPayload(input.lockedWebsiteValue),
      rejectedSourceFingerprint,
      reason: input.reason ?? null,
    },
    update: {
      lockedWebsiteFingerprint,
      lockedWebsiteValue: toJsonPayload(input.lockedWebsiteValue),
      rejectedSourceFingerprint,
      reason: input.reason ?? null,
    },
  });

  await recordContentEvent({
    eventType: 'CV_FIELD_LOCKED',
    payload: {
      fieldPath: input.fieldPath,
      hasRejectedFingerprint: rejectedSourceFingerprint !== null,
    },
  });

  return lock;
}

/**
 * Suppress repeated review when the candidate still matches the rejected source fingerprint.
 * Materially changed candidates are never suppressed.
 */
export function isFieldLockSuppressing(input: {
  fieldPath: string;
  candidateValue: unknown;
  locks: ImportFieldLock[];
}): boolean {
  const lock = input.locks.find((row) => row.fieldPath === input.fieldPath);
  if (!lock?.rejectedSourceFingerprint) {
    return false;
  }

  return fingerprintText(input.candidateValue) === lock.rejectedSourceFingerprint;
}
