/**
 * Pure helpers for CV-derived dynamic sections on draft SiteContent.
 * Conservative text parsing only — never trusts HTML/scripts.
 */

import type {
  DynamicSection,
  DynamicSectionItem,
  DynamicSectionPresentation,
  SiteContent,
} from '@/content/schema';

const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const SCRIPT_OR_STYLE_RE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const BULLET_LINE_RE = /^\s*(?:[-*•▪◦]|\d+[.)])\s+(.+)$/;
const TIMELINE_LINE_RE =
  /^\s*((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}(?:\s*[-–—]\s*(?:Present|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}))?)\s*[:\-–—]?\s+(.+)$/i;
const KEY_VALUE_LINE_RE = /^\s*([^:\n]{1,120})\s*:\s+(.+)$/;

export type BuildDynamicSectionInput = {
  id: string;
  title: string;
  presentation: DynamicSectionPresentation;
  rawText: string;
  sortOrder: number;
  sourceNormalizedTitle?: string;
};

/** Strip tags/scripts; keep plain text only. */
export function stripHtmlTags(text: string): string {
  return text
    .replace(SCRIPT_OR_STYLE_RE, ' ')
    .replace(HTML_TAG_RE, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizePlainText(raw: string): string {
  return stripHtmlTags(raw)
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function itemId(sectionId: string, index: number): string {
  return `${sectionId}__item_${index + 1}`;
}

function parseBulletItems(sectionId: string, text: string): DynamicSectionItem[] {
  const lines = text.split('\n');
  const items: DynamicSectionItem[] = [];
  for (const line of lines) {
    const m = BULLET_LINE_RE.exec(line);
    if (!m?.[1]) {continue;}
    const title = m[1].trim();
    if (!title) {continue;}
    items.push({ id: itemId(sectionId, items.length), title });
  }
  return items;
}

function parseTimelineItems(sectionId: string, text: string): DynamicSectionItem[] {
  const items: DynamicSectionItem[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {continue;}
    const m = TIMELINE_LINE_RE.exec(trimmed);
    if (m?.[1] && m[2]) {
      items.push({
        id: itemId(sectionId, items.length),
        title: m[2].trim(),
        date: m[1].trim(),
      });
      continue;
    }
    // Conservative: non-matching lines become undated items only when bullets exist-like.
    const bullet = BULLET_LINE_RE.exec(trimmed);
    if (bullet?.[1]) {
      items.push({ id: itemId(sectionId, items.length), title: bullet[1].trim() });
    }
  }
  return items;
}

function parseKeyValueItems(sectionId: string, text: string): DynamicSectionItem[] {
  const items: DynamicSectionItem[] = [];
  for (const line of text.split('\n')) {
    const m = KEY_VALUE_LINE_RE.exec(line);
    if (!m?.[1] || !m[2]) {continue;}
    const title = m[1].trim();
    const body = m[2].trim();
    if (!title || !body) {continue;}
    items.push({ id: itemId(sectionId, items.length), title, body });
  }
  return items;
}

function parseGroupedCardItems(sectionId: string, text: string): DynamicSectionItem[] {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const items: DynamicSectionItem[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {continue;}
    const first = lines[0] ?? '';
    const bullet = BULLET_LINE_RE.exec(first);
    const title = (bullet?.[1] ?? first).trim();
    if (!title) {continue;}
    const bodyLines = lines.slice(1);
    items.push({
      id: itemId(sectionId, items.length),
      title,
      ...(bodyLines.length > 0 ? { body: bodyLines.join('\n') } : {}),
    });
  }
  return items;
}

/**
 * Build a DynamicSection from raw CV text using presentation-specific heuristics.
 * Falls back to `body` when item parsing yields nothing.
 */
export function buildDynamicSectionFromCvText(input: BuildDynamicSectionInput): DynamicSection {
  const title = normalizePlainText(input.title).slice(0, 280) || 'CV section';
  const text = normalizePlainText(input.rawText);
  const base: DynamicSection = {
    id: input.id.trim() || 'dynamic-section',
    title,
    presentation: input.presentation,
    sortOrder: input.sortOrder,
    ...(input.sourceNormalizedTitle
      ? { sourceNormalizedTitle: normalizePlainText(input.sourceNormalizedTitle) }
      : {}),
  };

  if (!text) {
    return { ...base, body: '' };
  }

  if (input.presentation === 'rich_text') {
    return { ...base, body: text };
  }

  let items: DynamicSectionItem[] = [];
  if (input.presentation === 'bullet_list') {
    items = parseBulletItems(base.id, text);
  } else if (input.presentation === 'timeline') {
    items = parseTimelineItems(base.id, text);
  } else if (input.presentation === 'key_value') {
    items = parseKeyValueItems(base.id, text);
  } else if (input.presentation === 'grouped_cards') {
    items = parseGroupedCardItems(base.id, text);
  }

  if (items.length === 0) {
    return { ...base, body: text };
  }
  return { ...base, items };
}

/**
 * Upsert a dynamic section by id into `site.dynamicSections`.
 * Caller must only pass draft SiteContent — never mutates published rows in place.
 */
export function mergeDynamicSectionIntoSiteContent(
  site: SiteContent,
  section: DynamicSection,
): SiteContent {
  const current = [...(site.dynamicSections ?? [])];
  const idx = current.findIndex((row) => row.id === section.id);
  if (idx >= 0) {
    current[idx] = section;
  } else {
    current.push(section);
  }
  current.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  return { ...site, dynamicSections: current };
}
