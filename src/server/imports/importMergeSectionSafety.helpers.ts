import type { ImportReviewBlock } from '@/server/imports/importReviewStructured';

import type { ImportMergeSectionRiskLabel } from './importMergeSectionSafety.types';

export function blockMap(blocks: readonly ImportReviewBlock[]): Map<string, ImportReviewBlock> {
  const m = new Map<string, ImportReviewBlock>();
  for (const b of blocks) {
    m.set(b.id, b);
  }
  return m;
}

export function listChurn(block: ImportReviewBlock | undefined): { total: number; removed: number; added: number } {
  if (!block) {
    return { total: 0, removed: 0, added: 0 };
  }
  return {
    total: block.added.length + block.removed.length,
    removed: block.removed.length,
    added: block.added.length,
  };
}

export function maxRisk(a: ImportMergeSectionRiskLabel, b: ImportMergeSectionRiskLabel): ImportMergeSectionRiskLabel {
  const order: ImportMergeSectionRiskLabel[] = [
    'safe_to_merge',
    'needs_review',
    'review_only_default',
    'requires_explicit_replace',
  ];
  return order[Math.max(order.indexOf(a), order.indexOf(b))]!;
}
