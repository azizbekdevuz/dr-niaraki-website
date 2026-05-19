import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent } from '@/content/validators';
import { professionalSummaryParagraphsToText, textToProfessionalSummaryParagraphs } from '@/lib/draftEditorSlice';
import { buildImportCandidatePayload, extractDeclaredPatentCountFromText } from '@/server/imports/candidatePayload/builder';
import { mergeCvDetailsIntoSiteContent } from '@/server/imports/detailsToSiteContentMerge';
import {
  buildStructuredReviewBlocks,
  structuredMergeDiffIsVacuous,
} from '@/server/imports/importReviewStructured';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

function minimalDetails(overrides: Partial<DetailsSchemaType> = {}): DetailsSchemaType {
  const base: DetailsSchemaType = {
    profile: {
      name: 'Dr X',
      title: 'Prof',
      photoUrl: null,
      summary: null,
      meta: null,
    },
    about: {
      brief: null,
      full: null,
      education: [],
      positions: [],
      awards: [],
      languages: [],
      cvNarrativeSections: [],
    },
    research: { interests: [], projects: [], grants: [] },
    publications: [],
    patents: [],
    contact: {
      email: 'x@y.com',
      personalEmail: null,
      phone: null,
      fax: null,
      cellPhone: null,
      address: null,
      department: null,
      university: null,
      website: null,
      cvUrl: null,
      social: {},
    },
    rawHtml: null,
    counts: {
      publications: 0,
      patents: 0,
      projects: 0,
      awards: 0,
      students: 0,
    },
    meta: {
      sourceFileName: 'f.docx',
      parsedAt: '2026-01-01T00:00:00.000Z',
      parserVersion: 't',
      commitSha: null,
      uploader: null,
      warnings: [],
    },
  };
  return { ...base, ...overrides };
}

describe('Phase 3A import payload & merge', () => {
  it('split_v1 keeps Summary of Qualifications out of professional summary paragraphs', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const details = minimalDetails({
      meta: { ...minimalDetails().meta, cvSummaryMergePolicy: 'split_v1' },
      profile: {
        ...minimalDetails().profile,
        summary: 'Professional only line.',
      },
      about: {
        ...minimalDetails().about,
        full: 'Qualifications only — must not appear in about.page paragraphs.',
      },
    });
    const merged = mergeCvDetailsIntoSiteContent(details, baseline);
    const text = professionalSummaryParagraphsToText(merged.about.page.professionalSummaryParagraphs);
    expect(text).toContain('Professional only line.');
    expect(text).not.toContain('Qualifications only');
  });

  it('detects Professional Summary text change in structured review', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const merged = structuredClone(baseline);
    const before = professionalSummaryParagraphsToText(baseline.about.page.professionalSummaryParagraphs);
    merged.about.page.professionalSummaryParagraphs = textToProfessionalSummaryParagraphs(
      `${before}\n\nMetaverse -> MMMMMM`,
    );
    const blocks = buildStructuredReviewBlocks(baseline, merged, {
      importId: 'imp1',
      originalFileName: 'f.docx',
      storedPath: '/uploads/f.docx',
      uploadedFileId: 'uf1',
    });
    const summary = blocks.find((b) => b.id === 'summary');
    expect(summary?.unchangedSummary).toBeNull();
    expect(summary?.changed.length).toBeGreaterThan(0);
  });

  it('surfaces inserted research project in structured review', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const merged = structuredClone(baseline);
    merged.research.projects = [
      ...baseline.research.projects,
      {
        id: 'proj-phase3a-inserted',
        title: 'Inserted Research Project Alpha',
        description: 'Test description',
        period: '2024–2026',
        funding: 'NSF',
        amount: '$1',
        status: 'ongoing' as const,
        role: 'PI',
      },
    ];
    const blocks = buildStructuredReviewBlocks(baseline, merged, {
      importId: 'imp1',
      originalFileName: 'f.docx',
      storedPath: '/uploads/f.docx',
      uploadedFileId: 'uf1',
    });
    const rp = blocks.find((b) => b.id === 'research_projects');
    expect(rp?.added.some((l) => l.includes('proj-phase3a-inserted'))).toBe(true);
  });

  it('emits PATENT_COUNT_MISMATCH when heading declares many patents but few are extracted', () => {
    const raw = 'Intro line\nPatents (52 Registered & Completed)\nbody';
    expect(extractDeclaredPatentCountFromText(raw)).toBe(52);
    const patents = Array.from({ length: 5 }, (_, i) => ({
      id: `pt-${i}`,
      title: `Patent ${i}`,
      inventors: null,
      number: null,
      country: null,
      date: null,
      status: 'registered' as const,
      type: 'international' as const,
      link: null,
      raw: null,
    }));
    const details = minimalDetails({
      patents,
      counts: { publications: 0, patents: 5, projects: 0, awards: 0, students: 0 },
    });
    const envelope = buildImportCandidatePayload({
      rawDocumentText: raw,
      parserVersion: 't',
      details,
      sections: [],
      importWarnings: [],
    });
    expect(envelope.parserWarnings.some((w) => w.code === 'PATENT_COUNT_MISMATCH')).toBe(true);
    expect(envelope.countValidation.entries.some((e) => e.code === 'PATENT_COUNT_MISMATCH')).toBe(true);
  });

  it('structuredMergeDiffIsVacuous is true when only provenance differs from identical baseline merge', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const blocks = buildStructuredReviewBlocks(baseline, baseline, {
      importId: 'imp1',
      originalFileName: 'f.docx',
      storedPath: '/uploads/f.docx',
      uploadedFileId: 'uf1',
    });
    expect(structuredMergeDiffIsVacuous(blocks)).toBe(true);
  });

  it('mergeCvDetailsIntoSiteContent maps CV research.projects into site research.projects', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const details = minimalDetails({
      research: {
        interests: [],
        projects: [
          {
            id: 'cv-proj-1',
            title: 'CV Project',
            description: 'desc',
            period: '2020',
            funding: 'NSF',
            fundingAmount: '1',
            role: 'PI',
            status: 'completed',
            raw: null,
          },
        ],
        grants: [],
      },
      counts: { publications: 0, patents: 0, projects: 1, awards: 0, students: 0 },
    });
    const merged = mergeCvDetailsIntoSiteContent(details, baseline);
    expect(merged.research.projects.some((p) => p.id === 'cv-proj-1')).toBe(true);
  });

  it('RAW_CHANGED_ONLY gate: hash mismatch with vacuous structured diff should prompt raw review', () => {
    const baseline = assertSiteContent(SITE_CONTENT_RAW);
    const blocks = buildStructuredReviewBlocks(baseline, baseline, {
      importId: 'imp1',
      originalFileName: 'f.docx',
      storedPath: '/uploads/f.docx',
      uploadedFileId: 'uf1',
    });
    const priorHash = 'aa'.repeat(32);
    const curHash = 'bb'.repeat(32);
    const gate =
      Boolean(priorHash && curHash && priorHash !== curHash) && structuredMergeDiffIsVacuous(blocks);
    expect(gate).toBe(true);
  });
});
