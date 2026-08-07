import 'server-only';

import type { AcceptedCvBaseline, Prisma } from '@prisma/client';

import { recordContentEvent } from '@/server/content/contentEvents';
import { prisma } from '@/server/db/prisma';
import {
  getDetailsFromCandidatePayload,
  parseImportCandidatePayload,
} from '@/server/imports/candidatePayload/schema';
import { buildAcceptedCvNormalizedSnapshot } from '@/server/imports/cvUpdate/normalizeBaseline';
import { ImportDomainError } from '@/server/imports/types';

export const CURRENT_BASELINE_SLOT = 'current';

function toJsonPayload(data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}

export async function getCurrentAcceptedCvBaseline(): Promise<AcceptedCvBaseline | null> {
  return prisma.acceptedCvBaseline.findUnique({
    where: { slot: CURRENT_BASELINE_SLOT },
  });
}

export async function acceptCvBaselineFromImport(input: {
  importId: string;
  tx?: Prisma.TransactionClient;
}): Promise<AcceptedCvBaseline> {
  const db = input.tx ?? prisma;
  const row = await db.contentImport.findUnique({ where: { id: input.importId } });
  if (!row) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import not found.');
  }
  if (!row.candidatePayload) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import has no candidate payload to accept as baseline.');
  }

  const envelope = parseImportCandidatePayload(row.candidatePayload);
  const details = getDetailsFromCandidatePayload(row.candidatePayload);
  if (!details) {
    throw new ImportDomainError('IMPORT_NOT_FOUND', 'Import candidate payload is not valid Details JSON.');
  }

  const parserVersion = envelope?.parserVersion ?? row.parserVersion;
  const mappingVersion = envelope?.mappingVersion;
  if (!parserVersion || !mappingVersion) {
    throw new ImportDomainError(
      'IMPORT_NOT_FOUND',
      'Import candidate envelope is missing parser or mapping version.',
    );
  }

  const normalizedSnapshot = buildAcceptedCvNormalizedSnapshot({ details, envelope });
  const sourceTextHash = envelope?.sourceTextHash ?? null;

  const baseline = await db.acceptedCvBaseline.upsert({
    where: { slot: CURRENT_BASELINE_SLOT },
    create: {
      slot: CURRENT_BASELINE_SLOT,
      sourceImportId: input.importId,
      parserVersion,
      mappingVersion,
      sourceTextHash,
      normalizedSnapshot: toJsonPayload(normalizedSnapshot),
    },
    update: {
      sourceImportId: input.importId,
      acceptedAt: new Date(),
      parserVersion,
      mappingVersion,
      sourceTextHash,
      normalizedSnapshot: toJsonPayload(normalizedSnapshot),
    },
  });

  if (!input.tx) {
    await recordContentEvent({
      eventType: 'CV_BASELINE_ACCEPTED',
      payload: {
        importId: input.importId,
        baselineId: baseline.id,
        parserVersion,
        mappingVersion,
        sourceTextHash,
      },
    });
  }

  return baseline;
}
