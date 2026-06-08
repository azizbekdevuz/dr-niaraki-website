import 'server-only';

import {
  CV_NARRATIVE_LIST_ITEM_PREFIX,
  candidateCvNarrativesForSiteList,
} from '@/server/imports/cvNarrativeToSimpleLists';
import type { ImportReviewBlock } from '@/server/imports/importReviewStructured';
import type { ImportCandidateReviewMetadataDto } from '@/server/imports/types';
import type { CvNarrativeSection } from '@/types/details';

export type ImportMergeSectionRiskLabel =
  | 'safe_to_merge'
  | 'needs_review'
  | 'review_only_default'
  | 'requires_explicit_replace';

export type ImportMergeSectionSafety = {
  /** Matches structured review block ids (e.g. `journey`, `patents`). */
  id: string;
  title: string;
  risk: ImportMergeSectionRiskLabel;
  /** When false, `safe_update` merge keeps the baseline slice for this section. */
  includeInSafeMerge: boolean;
  reasons: string[];
};

export type ImportMergeSafetyReport = {
  defaultMergeMode: 'safe_update';
  /** `full_replace` merge requires `acknowledgeHighRisk` when any section is not `safe_to_merge`. */
  fullReplaceRequiresAck: boolean;
  sections: ImportMergeSectionSafety[];
  /** Cross-cutting notes (unmapped sections, envelope hints, etc.). */
  notes: string[];
};

function blockMap(blocks: readonly ImportReviewBlock[]): Map<string, ImportReviewBlock> {
  const m = new Map<string, ImportReviewBlock>();
  for (const b of blocks) {
    m.set(b.id, b);
  }
  return m;
}

function listChurn(block: ImportReviewBlock | undefined): { total: number; removed: number; added: number } {
  if (!block) {
    return { total: 0, removed: 0, added: 0 };
  }
  return {
    total: block.added.length + block.removed.length,
    removed: block.removed.length,
    added: block.added.length,
  };
}

function maxRisk(a: ImportMergeSectionRiskLabel, b: ImportMergeSectionRiskLabel): ImportMergeSectionRiskLabel {
  const order: ImportMergeSectionRiskLabel[] = [
    'safe_to_merge',
    'needs_review',
    'review_only_default',
    'requires_explicit_replace',
  ];
  return order[Math.max(order.indexOf(a), order.indexOf(b))]!;
}

/**
 * Heuristic section-level safety for DOCX import → working draft merge.
 * Drives `safe_update` (default) freezes and `full_replace` acknowledgement requirements.
 */
function reviewBlockShowsCvNarImports(block: ImportReviewBlock | undefined): boolean {
  if (!block) {
    return false;
  }
  const lines = [
    ...block.added,
    ...block.removed,
    ...block.changed.flatMap((c) => c.lines),
  ];
  return lines.some((line) => line.includes(CV_NARRATIVE_LIST_ITEM_PREFIX));
}

function assessCvNarrativeSiteList(
  id: 'teaching' | 'supervision' | 'service',
  title: string,
  narratives: readonly CvNarrativeSection[] | undefined,
  block: ImportReviewBlock | undefined,
  assessList: (
    listId: string,
    listTitle: string,
    opts: { heavyRemoved: number; heavyChurn: number; extraRisk?: ImportMergeSectionRiskLabel },
  ) => ImportMergeSectionSafety,
): ImportMergeSectionSafety {
  const hasNarrativeImport = candidateCvNarrativesForSiteList(narratives, id).length > 0;
  const hasCvNarChurn = reviewBlockShowsCvNarImports(block);
  if (hasNarrativeImport || hasCvNarChurn) {
    return {
      id,
      title,
      risk: 'review_only_default',
      includeInSafeMerge: false,
      reasons: [
        hasNarrativeImport
          ? 'Imported CV narrative sections would populate this public list with raw rows — use full replace with acknowledgement to apply.'
          : 'Structured diff shows cv-nar- list changes — held back from safe merge.',
      ],
    };
  }
  return assessList(id, title, { heavyRemoved: 4, heavyChurn: 14 });
}

export function evaluateImportMergeSectionSafety(input: {
  reviewBlocks: readonly ImportReviewBlock[];
  candidateReview: ImportCandidateReviewMetadataDto | null;
  cvNarrativeSections?: readonly CvNarrativeSection[];
}): ImportMergeSafetyReport {
  const notes: string[] = [];
  const bm = blockMap(input.reviewBlocks);
  const cr = input.candidateReview;

  if (cr?.unmappedSections?.length) {
    notes.push(
      `${cr.unmappedSections.length} envelope section(s) are still unmapped — inspect raw text before trusting list merges.`,
    );
  }
  if (cr?.reviewHint === 'NEEDS_REVIEW') {
    notes.push('Envelope `reviewHint` is NEEDS_REVIEW — parser or validation flagged manual inspection.');
  }
  if (cr?.reviewHint === 'RAW_CHANGED_ONLY') {
    notes.push('Envelope `reviewHint` references raw-only changes — structured merge may be incomplete.');
  }

  const patentMismatch = Boolean(cr?.countValidation.entries.some((e) => e.code === 'PATENT_COUNT_MISMATCH'));
  const parserErrors = (cr?.parserWarnings ?? []).filter((w) => w.severity === 'error');
  const parserWarnings = (cr?.parserWarnings ?? []).filter((w) => w.severity === 'warning');
  if (parserErrors.length) {
    notes.push(`${parserErrors.length} parser error(s) on the candidate — default merge avoids risky lists.`);
  }
  if (parserWarnings.length) {
    notes.push(`${parserWarnings.length} parser warning(s) on the candidate — review list sections carefully.`);
  }

  const assessList = (
    id: string,
    title: string,
    opts: { heavyRemoved: number; heavyChurn: number; extraRisk?: ImportMergeSectionRiskLabel },
  ): ImportMergeSectionSafety => {
    const b = bm.get(id);
    const { total, removed, added } = listChurn(b);
    const reasons: string[] = [];
    let risk: ImportMergeSectionRiskLabel = 'safe_to_merge';

    if (total === 0 && b?.changed.length === 0) {
      return { id, title, risk: 'safe_to_merge', includeInSafeMerge: true, reasons: ['No list churn detected against baseline.'] };
    }
    if (removed >= opts.heavyRemoved || total >= opts.heavyChurn) {
      risk = removed >= opts.heavyRemoved + 3 || total >= opts.heavyChurn + 10 ? 'requires_explicit_replace' : 'needs_review';
      reasons.push(`High churn vs baseline (${added} added, ${removed} removed, ${total} total).`);
    } else if (total >= 4 || removed >= 2) {
      risk = maxRisk(risk, 'needs_review');
      reasons.push(`Moderate churn (${added} added, ${removed} removed).`);
    }
    if (opts.extraRisk) {
      risk = maxRisk(risk, opts.extraRisk);
    }
    const includeInSafeMerge = risk === 'safe_to_merge';
    if (!includeInSafeMerge && reasons.length === 0) {
      reasons.push('Held back from default safe merge.');
    }
    return { id, title, risk, includeInSafeMerge, reasons };
  };

  const sections: ImportMergeSectionSafety[] = [];

  sections.push({
    id: 'profile',
    title: 'Profile',
    risk: 'safe_to_merge',
    includeInSafeMerge: true,
    reasons: ['Scalar profile fields use conservative overwrite rules.'],
  });
  sections.push({
    id: 'contact',
    title: 'Contact',
    risk: parserErrors.length ? 'needs_review' : 'safe_to_merge',
    includeInSafeMerge: parserErrors.length === 0,
    reasons: parserErrors.length ? ['Parser errors present — contact merge skipped by default.'] : ['Contact scalars merged when present.'],
  });
  sections.push({
    id: 'summary',
    title: 'Professional summary',
    risk: 'safe_to_merge',
    includeInSafeMerge: true,
    reasons: ['Narrative summary text is merged with split/qualifications policy — review diff in structured review.'],
  });

  sections.push(
    assessList('journey', 'Academic journey', { heavyRemoved: 4, heavyChurn: 8 }),
    assessList('experiences', 'Professional experience', { heavyRemoved: 4, heavyChurn: 22 }),
    assessList('awards', 'Awards', { heavyRemoved: 4, heavyChurn: 12 }),
  );

  let publications = assessList('publications', 'Publications', { heavyRemoved: 6, heavyChurn: 18 });
  if (parserErrors.some((e) => /PUBLICATION|PUB|DOI/i.test(e.code ?? '') || /publication/i.test(e.message))) {
    publications = {
      ...publications,
      risk: maxRisk(publications.risk, 'review_only_default'),
      includeInSafeMerge: false,
      reasons: [...publications.reasons, 'Parser errors mention publications — default merge skips publication list.'],
    };
  }
  sections.push(publications);

  const patChurn = listChurn(bm.get('patents'));
  let patRisk: ImportMergeSectionRiskLabel = patentMismatch ? 'review_only_default' : 'safe_to_merge';
  const patReasons: string[] = [];
  if (patentMismatch) {
    patReasons.push('Patent heading vs extracted count mismatch — patents are review-only by default.');
  } else if (patChurn.total >= 12 || patChurn.removed >= 4) {
    patRisk = 'needs_review';
    patReasons.push('Large patent list churn — held back from safe merge.');
  } else if (patChurn.total > 0) {
    patReasons.push('Patent list differs from baseline — inspect diff.');
  } else {
    patReasons.push('No patent list churn.');
  }
  sections.push({
    id: 'patents',
    title: 'Patents',
    risk: patentMismatch ? 'review_only_default' : patRisk,
    includeInSafeMerge: !patentMismatch && patRisk === 'safe_to_merge',
    reasons: patReasons,
  });

  const rp = assessList('research_projects', 'Research projects', { heavyRemoved: 3, heavyChurn: 24 });
  sections.push(rp);

  const ri = assessList('research_interests', 'Research interests', { heavyRemoved: 3, heavyChurn: 12 });
  sections.push(ri);

  const narratives = input.cvNarrativeSections;
  if (
    narratives?.some((s) => s.body.trim().length > 0 && s.kind !== 'other')
  ) {
    notes.push(
      'CV narrative sections are present — teaching, supervision, and service lists are review-only in safe update.',
    );
  }

  for (const id of ['teaching', 'supervision', 'service'] as const) {
    let title: string;
    if (id === 'teaching') {
      title = 'Teaching';
    } else if (id === 'supervision') {
      title = 'Supervision';
    } else {
      title = 'Service';
    }
    sections.push(assessCvNarrativeSiteList(id, title, narratives, bm.get(id), assessList));
  }

  const fullReplaceRequiresAck = sections.some((s) => s.risk !== 'safe_to_merge');

  return {
    defaultMergeMode: 'safe_update',
    fullReplaceRequiresAck,
    sections,
    notes,
  };
}

export type CvDetailsMergeFreezeKey =
  | 'profile'
  | 'summary'
  | 'journey'
  | 'experiences'
  | 'awards'
  | 'contact'
  | 'publications'
  | 'patents'
  | 'researchInterests'
  | 'researchProjects'
  | 'cvNarrative';

/** Maps structured-review block ids to merge freeze keys. */
export function mergeSectionBlockIdToFreezeKey(blockId: string): CvDetailsMergeFreezeKey | null {
  switch (blockId) {
    case 'profile':
      return 'profile';
    case 'contact':
      return 'contact';
    case 'summary':
      return 'summary';
    case 'journey':
      return 'journey';
    case 'experiences':
      return 'experiences';
    case 'awards':
      return 'awards';
    case 'publications':
      return 'publications';
    case 'patents':
      return 'patents';
    case 'research_interests':
      return 'researchInterests';
    case 'research_projects':
      return 'researchProjects';
    case 'teaching':
    case 'supervision':
    case 'service':
      return 'cvNarrative';
    default:
      return null;
  }
}

export function freezeKeysFromSafetyReport(report: ImportMergeSafetyReport): ReadonlySet<CvDetailsMergeFreezeKey> {
  const keys = new Set<CvDetailsMergeFreezeKey>();
  for (const s of report.sections) {
    if (!s.includeInSafeMerge) {
      const k = mergeSectionBlockIdToFreezeKey(s.id);
      if (k) {
        keys.add(k);
      }
    }
  }
  return keys;
}
