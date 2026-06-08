import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent } from '@/content/validators';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { resolveImportReviewBaseline } from '@/server/imports/reviewBaseline';
import {
  diffPublicationsSemantically,
  diffResearchProjectsSemantically,
  normalizePublicationDoi,
} from '@/server/imports/semanticListDiff';
import { minimalImportDetails } from '@/tests/fixtures/minimalImportDetails';
import type { DetectedSection } from '@/types/parser';
import { validateDetails } from '@/validators/detailsSchema';

describe('Import review semantics & baseline', () => {
  it('resolveImportReviewBaseline: published uses payload when valid', () => {
    const pure = assertSiteContent(SITE_CONTENT_RAW);
    const r = resolveImportReviewBaseline('published', {
      workingDraftPayload: null,
      publishedPayload: pure,
      publishedSequence: 3,
      publishedVersionId: 'vid123456789012345',
    });
    expect(r.baselineSource).toBe('published');
    expect(r.baseline).toEqual(pure);
    expect(r.capabilities.hasPublished).toBe(true);
  });

  it('normalizePublicationDoi strips doi.org prefixes', () => {
    expect(normalizePublicationDoi('https://doi.org/10.1234/ABCD')).toBe('10.1234/abcd');
    expect(normalizePublicationDoi('doi:10.1/x')).toBe('10.1/x');
  });

  it('resolveImportReviewBaseline: canonical ignores polluted working draft', () => {
    const pure = assertSiteContent(SITE_CONTENT_RAW);
    const polluted = structuredClone(pure);
    polluted.about.awards = [
      {
        id: 'test-evil',
        title: 'TEST-dsfg polluted',
        organization: 'X',
        year: '2020',
        details: '-',
        impact: '-',
        category: 'service',
      },
    ];
    const r = resolveImportReviewBaseline('canonical', {
      workingDraftPayload: polluted,
      publishedPayload: null,
      publishedSequence: null,
      publishedVersionId: null,
    });
    expect(r.baselineSource).toBe('canonical');
    expect(r.baseline).toEqual(pure);
    expect(r.baseline.about.awards.some((a) => a.title.includes('TEST-dsfg'))).toBe(false);
  });

  it('resolveImportReviewBaseline: auto prefers working draft when present', () => {
    const pure = assertSiteContent(SITE_CONTENT_RAW);
    const polluted = structuredClone(pure);
    polluted.about.awards = [];
    const r = resolveImportReviewBaseline('auto', {
      workingDraftPayload: polluted,
      publishedPayload: null,
      publishedSequence: null,
      publishedVersionId: null,
    });
    expect(r.baselineSource).toBe('working_draft');
    expect(r.baseline).toEqual(polluted);
    expect(r.capabilities.hasWorkingDraft).toBe(true);
  });

  it('resolveImportReviewBaseline: published falls back to canonical when no published snapshot', () => {
    const r = resolveImportReviewBaseline('published', {
      workingDraftPayload: null,
      publishedPayload: null,
      publishedSequence: null,
      publishedVersionId: null,
    });
    expect(r.baselineSource).toBe('canonical');
    expect(r.fallbackWarnings.some((w) => w.code === 'BASELINE_FALLBACK')).toBe(true);
  });

  it('diffPublicationsSemantically pairs different ids when DOI matches', () => {
    const before = [
      {
        id: 'site-pub-1',
        title: 'Neural Widgets',
        authors: 'A',
        journal: 'J',
        year: 2019,
        type: 'journal' as const,
        doi: '10.1000/xyz',
      },
    ];
    const after = [
      {
        id: 'import-gen-99',
        title: 'Neural Widgets',
        authors: 'A',
        journal: 'J',
        year: 2019,
        type: 'journal' as const,
        doi: 'https://doi.org/10.1000/XYZ',
      },
    ];
    const d = diffPublicationsSemantically(before, after);
    expect(d.added).toHaveLength(0);
    expect(d.removed).toHaveLength(0);
    expect(d.changed).toHaveLength(0);
    expect(d.unchangedCount).toBe(1);
  });

  it('diffResearchProjectsSemantically pairs different ids when normalized title matches', () => {
    const before = [
      {
        id: 'curated-proj-1',
        title: 'Project: Smart Grid Study',
        description: 'D',
        period: '2020',
        funding: 'NSF',
        amount: '1',
        status: 'ongoing' as const,
        role: 'PI',
      },
    ];
    const after = [
      {
        id: 'parsed-proj-new',
        title: 'smart grid study',
        description: 'D',
        period: '2020',
        funding: 'NSF',
        amount: '1',
        status: 'ongoing' as const,
        role: 'PI',
      },
    ];
    const d = diffResearchProjectsSemantically(before, after);
    expect(d.added).toHaveLength(0);
    expect(d.removed).toHaveLength(0);
    expect(d.changed).toHaveLength(0);
    expect(d.unchangedCount).toBe(1);
  });

  it('buildImportCandidatePayload maps single research section itemCount to structured projects length', () => {
    const projects = Array.from({ length: 8 }, (_, i) => ({
      id: `p-${i}`,
      title: `Project ${i}`,
      description: 'd',
      period: '2020',
      funding: 'x',
      fundingAmount: '1',
      role: 'PI',
      status: 'ongoing' as const,
      raw: null,
    }));
    const details = minimalImportDetails({
      research: { interests: [], projects, grants: [] },
      counts: { publications: 0, patents: 0, projects: 8, awards: 0, students: 0 },
    });
    const vd = validateDetails(details);
    expect(vd.success).toBe(true);
    const sections: DetectedSection[] = [
      { type: 'research', title: 'Research Projects', content: 'line1\nline2', confidence: 1 },
    ];
    const envelope = buildImportCandidatePayload({
      rawDocumentText: 'body',
      parserVersion: 't',
      details: vd.data!,
      sections,
      importWarnings: [],
    });
    const row = envelope.sectionMappingReport.find((r) => r.docxSectionTitle === 'Research Projects');
    expect(row?.itemCount).toBe(8);
  });

  it('buildImportCandidatePayload classifies preamble-like unknown as cv.header and drops from unmapped', () => {
    const details = minimalImportDetails();
    const vd = validateDetails(details);
    expect(vd.success).toBe(true);
    const sections: DetectedSection[] = [
      {
        type: 'unknown',
        title: 'Preamble',
        content: 'Dr Jane Doe\njane@university.edu\n+1 (555) 123-4567\nhttps://www.example.edu/lab',
        confidence: 0.4,
      },
    ];
    const envelope = buildImportCandidatePayload({
      rawDocumentText: 'x',
      parserVersion: 't',
      details: vd.data!,
      sections,
      importWarnings: [],
    });
    expect(envelope.unmappedSections.some((u) => u.title === 'Preamble')).toBe(false);
    const row = envelope.sectionMappingReport.find((r) => r.docxSectionTitle === 'Preamble');
    expect(row?.mappedWebsiteSection).toBe('cv.header');
    expect(row?.confidence).toBe('alias');
  });
});
