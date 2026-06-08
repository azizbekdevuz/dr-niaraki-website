/**
 * Semantic pairing for import structured review — reduces false add/remove churn when only ids differ.
 */

import type { PublicationItem, ResearchProjectItem } from '@/content/schema';
import {
  shallowFieldChanges,
  type ListDiffEntry,
  type ListItemChange,
  type StructuredListDiff,
} from '@/server/imports/importListDiff';

const PUB_KEYS = ['title', 'authors', 'journal', 'year', 'type', 'doi'] as const satisfies readonly (keyof PublicationItem & string)[];

const PROJ_KEYS = [
  'title',
  'description',
  'period',
  'funding',
  'amount',
  'status',
  'role',
] as const satisfies readonly (keyof ResearchProjectItem & string)[];

export function normalizePublicationDoi(raw: string | undefined): string {
  if (!raw) {
    return '';
  }
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  s = s.replace(/^doi:\s*/i, '');
  return s.trim();
}

function normalizePubTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9\s]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function publicationKeyCandidates(p: PublicationItem): string[] {
  const doi = normalizePublicationDoi(p.doi);
  if (doi) {
    return [`doi:${doi}`];
  }
  const t = normalizePubTitle(p.title);
  return [`ty:${t}|${p.year}`, `t:${t}`];
}

function normalizeProjectTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^project\s*:\s*/i, '')
    .trim();
}

function projectKeyCandidates(p: ResearchProjectItem): string[] {
  return [`t:${normalizeProjectTitle(p.title)}`];
}

function findBestSemanticMatch<T extends { id: string }>(
  bRow: T,
  afterPool: readonly T[],
  consumedAfter: Set<string>,
  keyCandidates: (row: T) => string[],
): T | null {
  for (const key of keyCandidates(bRow)) {
    for (const aRow of afterPool) {
      if (consumedAfter.has(aRow.id)) {
        continue;
      }
      if (keyCandidates(aRow).includes(key)) {
        return aRow;
      }
    }
  }
  return null;
}

function classifyRowDelta<T>(
  bRow: T,
  aRow: T,
  compareKeys: readonly (keyof T & string)[],
): { kind: 'unchanged' } | { kind: 'changed'; changes: ListItemChange } {
  const changes = shallowFieldChanges(bRow, aRow, compareKeys);
  if (changes.length === 0) {
    return { kind: 'unchanged' };
  }
  const id = (aRow as { id: string }).id;
  const label = (aRow as { title: string }).title;
  return { kind: 'changed', changes: { id, label, changes } };
}

function diffWithSemanticPairing<T extends { id: string; title: string }>(
  before: readonly T[],
  after: readonly T[],
  compareKeys: readonly (keyof T & string)[],
  keyCandidates: (row: T) => string[],
): StructuredListDiff {
  const beforeMap = new Map(before.map((r) => [r.id, r]));
  const afterMap = new Map(after.map((r) => [r.id, r]));

  const added: ListDiffEntry[] = [];
  const removed: ListDiffEntry[] = [];
  const changed: ListItemChange[] = [];
  let unchangedCount = 0;

  const matchedIds = new Set<string>();

  for (const [id, aRow] of afterMap) {
    const bRow = beforeMap.get(id);
    if (!bRow) {
      continue;
    }
    matchedIds.add(id);
    const delta = classifyRowDelta(bRow, aRow, compareKeys);
    if (delta.kind === 'unchanged') {
      unchangedCount += 1;
    } else {
      changed.push(delta.changes);
    }
  }

  const beforePool = before.filter((r) => !matchedIds.has(r.id));
  const afterPool = after.filter((r) => !matchedIds.has(r.id));

  const consumedBefore = new Set<string>();
  const consumedAfter = new Set<string>();

  for (const bRow of beforePool) {
    if (consumedBefore.has(bRow.id)) {
      continue;
    }
    const pair = findBestSemanticMatch(bRow, afterPool, consumedAfter, keyCandidates);
    if (!pair) {
      continue;
    }
    consumedBefore.add(bRow.id);
    consumedAfter.add(pair.id);
    const delta = classifyRowDelta(bRow, pair, compareKeys);
    if (delta.kind === 'unchanged') {
      unchangedCount += 1;
    } else {
      changed.push(delta.changes);
    }
  }

  for (const aRow of afterPool) {
    if (!consumedAfter.has(aRow.id)) {
      added.push({ id: aRow.id, label: aRow.title });
    }
  }
  for (const bRow of beforePool) {
    if (!consumedBefore.has(bRow.id)) {
      removed.push({ id: bRow.id, label: bRow.title });
    }
  }

  return { added, removed, changed, unchangedCount };
}

export function diffPublicationsSemantically(
  before: readonly PublicationItem[],
  after: readonly PublicationItem[],
): StructuredListDiff {
  const norm = (p: PublicationItem): PublicationItem => {
    const nd = normalizePublicationDoi(p.doi);
    return { ...p, doi: nd || p.doi };
  };
  return diffWithSemanticPairing(
    before.map(norm),
    after.map(norm),
    PUB_KEYS,
    publicationKeyCandidates,
  );
}

export function diffResearchProjectsSemantically(
  before: readonly ResearchProjectItem[],
  after: readonly ResearchProjectItem[],
): StructuredListDiff {
  const norm = (p: ResearchProjectItem): ResearchProjectItem => ({
    ...p,
    title: normalizeProjectTitle(p.title),
  });
  return diffWithSemanticPairing(before.map(norm), after.map(norm), PROJ_KEYS, projectKeyCandidates);
}
