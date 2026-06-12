import 'server-only';

import crypto from 'node:crypto';

import { getAiReviewRuntimeConfig } from '@/server/ai/aiReviewConfig';
import { redactSensitiveText } from '@/server/ai/aiReviewRedact';
import type { AiReviewInput } from '@/server/ai/aiReviewTypes';
import { buildImportReviewPayload } from '@/server/imports/importReviewCompare';
import type { ImportReviewBlock } from '@/server/imports/importReviewStructured';
import { getContentImportDetail } from '@/server/imports/repository';
import type { ReviewBaselineMode } from '@/server/imports/reviewBaseline';
import { buildImportCandidateReviewMetadata } from '@/server/imports/serialize';

const RISKY_RISKS = new Set(['needs_review', 'review_only_default', 'requires_explicit_replace']);
const MAX_SAMPLE_LINES = 2;
const MAX_SAMPLE_LINE_CHARS = 200;

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

export function hashAiReviewInput(input: AiReviewInput): string {
  return crypto.createHash('sha256').update(stableStringify(input)).digest('hex');
}

function sampleLinesFromBlock(block: ImportReviewBlock, risky: boolean): string[] | undefined {
  if (!risky) {
    return undefined;
  }
  const lines: string[] = [];
  for (const item of block.changed) {
    for (const ln of item.lines) {
      if (lines.length >= MAX_SAMPLE_LINES) {
        break;
      }
      const redacted = redactSensitiveText(ln);
      lines.push(redacted.length > MAX_SAMPLE_LINE_CHARS ? `${redacted.slice(0, MAX_SAMPLE_LINE_CHARS)}...` : redacted);
    }
  }
  if (lines.length < MAX_SAMPLE_LINES) {
    for (const ln of block.added) {
      if (lines.length >= MAX_SAMPLE_LINES) {
        break;
      }
      const redacted = redactSensitiveText(ln);
      lines.push(redacted.length > MAX_SAMPLE_LINE_CHARS ? `${redacted.slice(0, MAX_SAMPLE_LINE_CHARS)}...` : redacted);
    }
  }
  return lines.length > 0 ? lines : undefined;
}

function fitBlockSummaries(
  input: AiReviewInput,
  blockSummaries: AiReviewInput['blockSummaries'],
  count: number,
): AiReviewInput {
  return { ...input, blockSummaries: blockSummaries.slice(0, count) };
}

function binarySearchBlockFit(
  input: AiReviewInput,
  blockSummaries: AiReviewInput['blockSummaries'],
  maxChars: number,
): AiReviewInput {
  let lo = 0;
  let hi = blockSummaries.length;
  let best = fitBlockSummaries(input, blockSummaries, 0);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = fitBlockSummaries(input, blockSummaries, mid);
    if (stableStringify(candidate).length <= maxChars) {
      best = candidate;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function trimInputToCap(input: AiReviewInput, maxChars: number): AiReviewInput {
  let current: AiReviewInput = input;
  if (stableStringify(current).length <= maxChars) {
    return current;
  }

  current = {
    ...current,
    blockSummaries: current.blockSummaries.map((b) => ({ ...b, sampleLines: undefined })),
  };
  if (stableStringify(current).length <= maxChars) {
    return current;
  }

  const riskyBlocks = current.blockSummaries.filter((b) =>
    current.mergeSafety.sections.some((s) => s.id === b.id && RISKY_RISKS.has(s.risk)),
  );
  current = binarySearchBlockFit(current, riskyBlocks, maxChars);
  if (stableStringify(current).length <= maxChars) {
    return current;
  }

  current = { ...current, blockSummaries: [] };
  if (stableStringify(current).length <= maxChars) {
    return current;
  }

  current = {
    ...current,
    mergeSafety: {
      ...current.mergeSafety,
      sections: current.mergeSafety.sections.map((s) => ({
        ...s,
        reasons: s.reasons.slice(0, 2).map((r) => (r.length > 120 ? `${r.slice(0, 120)}...` : r)),
      })),
      notes: current.mergeSafety.notes.slice(0, 3),
    },
    parserWarnings: current.parserWarnings.slice(0, 10),
    reviewWarnings: current.reviewWarnings.slice(0, 10),
    unmappedSections: current.unmappedSections.slice(0, 5),
    countValidation: current.countValidation.slice(0, 10),
  };
  if (stableStringify(current).length <= maxChars) {
    return current;
  }

  current = {
    ...current,
    unmappedSections: [],
    countValidation: current.countValidation.slice(0, 3),
    mergeSafety: {
      ...current.mergeSafety,
      sections: current.mergeSafety.sections
        .filter((s) => RISKY_RISKS.has(s.risk))
        .map((s) => ({ ...s, reasons: s.reasons.slice(0, 1) })),
      notes: current.mergeSafety.notes.slice(0, 1),
    },
    parserWarnings: current.parserWarnings.slice(0, 5),
    reviewWarnings: current.reviewWarnings.slice(0, 5),
  };
  if (stableStringify(current).length <= maxChars) {
    return current;
  }

  return {
    ...current,
    blockSummaries: [],
    unmappedSections: [],
    countValidation: [],
    reviewWarnings: current.reviewWarnings.slice(0, 3),
    parserWarnings: current.parserWarnings.slice(0, 3),
    mergeSafety: {
      fullReplaceRequiresAck: current.mergeSafety.fullReplaceRequiresAck,
      sections: current.mergeSafety.sections.slice(0, 8).map((s) => ({
        id: s.id,
        title: s.title,
        risk: s.risk,
        includeInSafeMerge: s.includeInSafeMerge,
        reasons: s.reasons.slice(0, 1).map((r) => (r.length > 80 ? `${r.slice(0, 80)}...` : r)),
      })),
      notes: [],
    },
  };
}

export async function buildAiReviewInput(
  importId: string,
  baseline: ReviewBaselineMode,
): Promise<{ input: AiReviewInput; inputHash: string } | null> {
  const row = await getContentImportDetail(importId);
  if (!row) {
    return null;
  }

  const review = await buildImportReviewPayload(importId, { baseline });
  const candidateReview = buildImportCandidateReviewMetadata(row.candidatePayload);
  const riskySectionIds = new Set(
    review.mergeSafety.sections.filter((s) => RISKY_RISKS.has(s.risk)).map((s) => s.id),
  );

  const input: AiReviewInput = {
    importId: row.id,
    importStatus: row.status,
    parserVersion: candidateReview?.parserVersion ?? row.parserVersion,
    mappingVersion: candidateReview?.mappingVersion ?? null,
    baselineSource: review.baselineSource,
    baselineLabel: review.baselineLabel,
    reviewHint: candidateReview?.reviewHint ?? null,
    countValidation:
      candidateReview?.countValidation?.entries?.map((e) => ({
        code: e.code,
        domain: e.domain,
        severity: e.severity,
        declaredInHeading: e.declaredInHeading,
        extractedCount: e.extractedCount,
      })) ?? [],
    parserWarnings:
      candidateReview?.parserWarnings?.map((w) => ({
        code: w.code,
        message: redactSensitiveText(w.message),
        severity: w.severity,
      })) ?? [],
    unmappedSections:
      candidateReview?.unmappedSections?.map((u) => ({
        sectionId: u.sectionId,
        title: u.title,
        reason: redactSensitiveText(u.reason),
      })) ?? [],
    mergeSafety: {
      fullReplaceRequiresAck: review.mergeSafety.fullReplaceRequiresAck,
      sections: review.mergeSafety.sections.map((s) => ({
        id: s.id,
        title: s.title,
        risk: s.risk,
        includeInSafeMerge: s.includeInSafeMerge,
        reasons: s.reasons.map((r) => redactSensitiveText(r)),
      })),
      notes: review.mergeSafety.notes.map((n) => redactSensitiveText(n)),
    },
    reviewWarnings: review.warnings.map((w) => ({
      code: w.code,
      message: redactSensitiveText(w.message),
    })),
    blockSummaries: review.blocks.map((b) => ({
      id: b.id,
      title: b.title,
      addedCount: b.added.length,
      removedCount: b.removed.length,
      changedCount: b.changed.length,
      sampleLines: sampleLinesFromBlock(b, riskySectionIds.has(b.id)),
    })),
  };

  const { maxInputChars } = getAiReviewRuntimeConfig();
  const capped = trimInputToCap(input, maxInputChars);
  return { input: capped, inputHash: hashAiReviewInput(capped) };
}
