import crypto from 'crypto';

import { normalizeWhitespace } from '@/parser/parserUtils';
import {
  CANDIDATE_PAYLOAD_ENVELOPE_VERSION,
  CANDIDATE_PAYLOAD_SCHEMA_VERSION,
  type CountValidation,
  type ImportCandidatePayload,
  type ImportRawSection,
  type ImportReviewHint,
  type ImportUnmappedSectionRef,
  type SectionMappingReportRow,
} from '@/server/imports/candidatePayload/types';
import type { ImportWarningItem } from '@/server/imports/types';
import type { Details } from '@/types/details';
import type { DetectedSection } from '@/types/parser';

const MAPPING_VERSION = 'map-2026.03a';

function sha256Hex(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\u00a0\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Declared count in headings like `Patents (52 Registered & Completed)` anywhere in the document. */
export function extractDeclaredPatentCountFromText(fullText: string): number | null {
  const re = /patents?\s*\(\s*(\d+)/gi;
  let best: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fullText)) !== null) {
    const n = parseInt(m[1]!, 10);
    if (!Number.isNaN(n)) {
      best = best === null ? n : Math.max(best, n);
    }
  }
  return best;
}

function buildRawSections(sections: readonly DetectedSection[]): ImportRawSection[] {
  return sections.map((s, i) => ({
    id: `ts-sec-${i}-${sha256Hex(s.title).slice(0, 10)}`,
    parentId: null,
    title: s.title,
    normalizedTitle: normalizeTitle(s.title),
    level: 1,
    startIndex: 0,
    endIndex: 0,
    rawText: s.content,
    sectionType: s.type,
    source: 'typescript' as const,
    warnings: [],
  }));
}

function mapSectionToWebsiteTarget(
  s: DetectedSection,
): Pick<SectionMappingReportRow, 'mappedWebsiteSection' | 'confidence' | 'parserUsed'> {
  const t = s.type;
  const exact: Record<string, { path: string; parser: string }> = {
    profile: { path: 'profile', parser: 'profileHeader' },
    professional_summary: { path: 'about.page.professionalSummaryParagraphs', parser: 'summarySplit' },
    summary: { path: 'about.page.professionalSummaryParagraphs', parser: 'summaryLegacy' },
    summary_of_qualifications: { path: 'about.full', parser: 'summarySplit' },
    education: { path: 'about.journey', parser: 'educationParser' },
    experience: { path: 'about.experiences', parser: 'experienceParser' },
    awards: { path: 'about.awards', parser: 'awardsParser' },
    publications: { path: 'publications.items', parser: 'publicationsParser' },
    patents: { path: 'patents.items', parser: 'patentsParser' },
    research: { path: 'research.projects', parser: 'researchProjectsParser' },
    grants: { path: 'research.grants', parser: 'grantsParser' },
    contact: { path: 'contact', parser: 'contactParser' },
    services: { path: 'about.cvNarrativeSections', parser: 'cvNarrative' },
    workshops: { path: 'about.cvNarrativeSections', parser: 'cvNarrative' },
    skills: { path: 'about.cvNarrativeSections', parser: 'cvNarrative' },
    academic_narrative: { path: 'about.cvNarrativeSections', parser: 'cvNarrative' },
  };
  if (t in exact) {
    const e = exact[t as keyof typeof exact]!;
    return { mappedWebsiteSection: e.path, confidence: 'exact', parserUsed: e.parser };
  }
  if (t === 'unknown') {
    return { mappedWebsiteSection: null, confidence: 'unmapped', parserUsed: 'none' };
  }
  return { mappedWebsiteSection: null, confidence: 'alias', parserUsed: 'narrativeOrUnknown' };
}

function buildMappingReport(sections: readonly DetectedSection[]): SectionMappingReportRow[] {
  return sections.map((s, i) => {
    const m = mapSectionToWebsiteTarget(s);
    let itemCount = s.content.split('\n').filter((l) => l.trim().length > 0).length;
    if (s.type === 'publications' || s.type === 'patents' || s.type === 'research') {
      itemCount = 0;
    }
    return {
      docxSectionId: `ts-sec-${i}-${sha256Hex(s.title).slice(0, 10)}`,
      docxSectionTitle: s.title,
      normalizedTitle: normalizeTitle(s.title),
      mappedWebsiteSection: m.mappedWebsiteSection,
      confidence: m.confidence,
      parserUsed: m.parserUsed,
      itemCount,
      warnings: [],
    };
  });
}

function buildUnmapped(sections: readonly DetectedSection[]): ImportUnmappedSectionRef[] {
  const out: ImportUnmappedSectionRef[] = [];
  sections.forEach((s, i) => {
    if (s.type === 'unknown' && s.content.trim().length > 0) {
      out.push({
        sectionId: `ts-sec-${i}-${sha256Hex(s.title).slice(0, 10)}`,
        title: s.title,
        reason: 'No confident section type — inspect raw text.',
      });
    }
  });
  return out;
}

function buildPatentCountValidation(declared: number | null, extracted: number): CountValidation {
  const entries: CountValidation['entries'] = [];
  if (declared !== null && declared >= 10 && extracted < declared * 0.5) {
    entries.push({
      domain: 'patents',
      declaredInHeading: declared,
      extractedCount: extracted,
      severity: 'warning',
      code: 'PATENT_COUNT_MISMATCH',
    });
  }
  return { entries };
}

function mergeReviewHint(countVal: CountValidation, baseHint: ImportReviewHint): ImportReviewHint {
  if (countVal.entries.some((e) => e.severity === 'warning' || e.severity === 'error')) {
    return 'NEEDS_REVIEW';
  }
  return baseHint;
}

export function buildImportCandidatePayload(input: {
  rawDocumentText: string;
  parserVersion: string;
  details: Details;
  sections: readonly DetectedSection[];
  importWarnings: ImportWarningItem[];
}): ImportCandidatePayload {
  const rawSections = buildRawSections(input.sections);
  const sectionMappingReport = buildMappingReport(input.sections);
  const unmappedSections = buildUnmapped(input.sections);
  const normalizedFull = normalizeWhitespace(input.rawDocumentText);
  const declaredPatents = extractDeclaredPatentCountFromText(normalizedFull);
  const countValidation = buildPatentCountValidation(declaredPatents, input.details.patents.length);
  const patentMismatchWarnings: ImportWarningItem[] = countValidation.entries
    .filter((e) => e.code === 'PATENT_COUNT_MISMATCH')
    .map((e) => ({
      code: e.code,
      message: `Patent heading declares ${e.declaredInHeading} patents but parser extracted ${e.extractedCount}.`,
    }));
  const parserWarnings = [...input.importWarnings, ...patentMismatchWarnings];
  const reviewHint = mergeReviewHint(countValidation, 'READY');

  return {
    schemaVersion: CANDIDATE_PAYLOAD_SCHEMA_VERSION,
    envelopeVersion: CANDIDATE_PAYLOAD_ENVELOPE_VERSION,
    sourceTextHash: sha256Hex(normalizedFull),
    parserVersion: input.parserVersion,
    mappingVersion: MAPPING_VERSION,
    rawDocumentText: input.rawDocumentText,
    details: input.details,
    rawSections,
    unmappedSections,
    sectionMappingReport,
    countValidation,
    parserWarnings,
    reviewHint,
  };
}
