import 'server-only';

import type { CvDynamicSectionPresentation, CvSectionMapping } from '@prisma/client';

import { recordContentEvent } from '@/server/content/contentEvents';
import { prisma } from '@/server/db/prisma';
import { normalizeReviewTitle } from '@/server/imports/candidateReviewIdentity';

export function normalizeCvSectionTitle(title: string): string {
  return normalizeReviewTitle(title);
}

export async function listCvSectionMappings(): Promise<CvSectionMapping[]> {
  return prisma.cvSectionMapping.findMany({
    orderBy: [{ sortOrder: 'asc' }, { normalizedTitle: 'asc' }],
  });
}

export async function upsertCvSectionMapping(input: {
  sourceTitle: string;
  presentation: CvDynamicSectionPresentation;
  displayTitle?: string | null;
  sortOrder?: number;
}): Promise<CvSectionMapping> {
  const normalizedTitle = normalizeCvSectionTitle(input.sourceTitle);

  const mapping = await prisma.cvSectionMapping.upsert({
    where: { normalizedTitle },
    create: {
      normalizedTitle,
      sourceTitle: input.sourceTitle.trim(),
      presentation: input.presentation,
      displayTitle: input.displayTitle?.trim() || null,
      sortOrder: input.sortOrder ?? 100,
    },
    update: {
      sourceTitle: input.sourceTitle.trim(),
      presentation: input.presentation,
      ...(input.displayTitle !== undefined ? { displayTitle: input.displayTitle?.trim() || null } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  await recordContentEvent({
    eventType: 'CV_SECTION_MAPPED',
    payload: {
      normalizedTitle,
      presentation: input.presentation,
    },
  });

  return mapping;
}
