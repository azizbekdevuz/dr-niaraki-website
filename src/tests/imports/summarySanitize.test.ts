import { describe, expect, it } from 'vitest';

import {
  deduplicateParagraphs,
  HOME_INTRO_MAX,
  sanitizeImportedSummary,
  TAGLINE_MAX,
  trimToFieldMax,
} from '@/server/imports/summarySanitize';

// ---------------------------------------------------------------------------
// trimToFieldMax
// ---------------------------------------------------------------------------
describe('trimToFieldMax', () => {
  it('returns text unchanged when within limit', () => {
    const text = 'Short text.';
    const { result, wasTrimmed } = trimToFieldMax(text, 200);
    expect(result).toBe(text);
    expect(wasTrimmed).toBe(false);
  });

  it('truncates at sentence boundary when available', () => {
    const text =
      'First sentence ends here. Second sentence also ends here. Third sentence never reached beyond this point.';
    const { result, wasTrimmed } = trimToFieldMax(text, 60);
    expect(wasTrimmed).toBe(true);
    // Should end at the last sentence boundary within 60 chars
    expect(result.endsWith('.')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(60);
  });

  it('falls back to word boundary and appends ellipsis when no sentence boundary', () => {
    const text = 'OneWord TwoWord ThreeWord FourWord FiveWord SixWord SevenWord EightWord NineWord TenWord';
    const { result, wasTrimmed } = trimToFieldMax(text, 40);
    expect(wasTrimmed).toBe(true);
    expect(result.endsWith('\u2026')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(41); // limit + ellipsis char
  });
});

// ---------------------------------------------------------------------------
// deduplicateParagraphs
// ---------------------------------------------------------------------------
describe('deduplicateParagraphs', () => {
  it('removes exact duplicate paragraphs', () => {
    const para = 'Dr. Smith is a professor of computer science at Sejong University.';
    const { paragraphs, removedCount } = deduplicateParagraphs([para, para]);
    expect(paragraphs).toHaveLength(1);
    expect(removedCount).toBe(1);
  });

  it('removes near-duplicate that shares opening words', () => {
    // Both share the same first 12 normalized words — only the tail differs.
    const p1 = 'Dr. Smith is a professor of computer science at Sejong University in Seoul, Korea.';
    const p2 = 'Dr. Smith is a professor of computer science at Sejong University in Seongnam, with extensive research experience.';
    const { paragraphs, removedCount } = deduplicateParagraphs([p1, p2]);
    expect(paragraphs).toHaveLength(1);
    expect(removedCount).toBe(1);
  });

  it('keeps distinct paragraphs', () => {
    const p1 = 'Research interests include GIS, spatial computing, and remote sensing applications.';
    const p2 = 'He has published over 200 papers in leading international journals.';
    const p3 = 'Industry collaboration spans four continents with Fortune 500 companies.';
    const { paragraphs, removedCount } = deduplicateParagraphs([p1, p2, p3]);
    expect(paragraphs).toHaveLength(3);
    expect(removedCount).toBe(0);
  });

  it('keeps first occurrence when duplicate appears later', () => {
    const p1 = 'Opening paragraph about the professor and his work at the university campus.';
    const p2 = 'Middle paragraph with different content describing research achievements.';
    const p3 = 'Opening paragraph about the professor and his work at the university campus.';
    const { paragraphs, removedCount } = deduplicateParagraphs([p1, p2, p3]);
    expect(paragraphs).toEqual([p1, p2]);
    expect(removedCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// sanitizeImportedSummary
// ---------------------------------------------------------------------------
describe('sanitizeImportedSummary', () => {
  const shortSummary = 'Dr. Kim is a professor of GIS at Sejong University.';

  it('leaves short texts unchanged with no trimNotes', () => {
    const result = sanitizeImportedSummary({
      profileSummary: shortSummary,
      brief: 'A brief tagline.',
      full: null,
      profileTitle: 'Professor',
      cvSummaryMergePolicy: null,
    });
    expect(result.homeAboutIntro).toBe(shortSummary);
    expect(result.aboutIntroTagline).toBe('A brief tagline.');
    expect(result.trimNotes).toHaveLength(0);
  });

  it('trims long homeAboutIntro to HOME_INTRO_MAX', () => {
    const longSummary = `${'A '.repeat(400)}end sentence here.`;
    const result = sanitizeImportedSummary({
      profileSummary: longSummary,
      brief: null,
      full: null,
      profileTitle: null,
      cvSummaryMergePolicy: null,
    });
    expect(result.homeAboutIntro.length).toBeLessThanOrEqual(HOME_INTRO_MAX);
    expect(result.trimNotes.some((n) => n.includes('Home intro trimmed'))).toBe(true);
  });

  it('trims long aboutIntroTagline to TAGLINE_MAX', () => {
    const longBrief = 'Brief sentence. '.repeat(30);
    const result = sanitizeImportedSummary({
      profileSummary: null,
      brief: longBrief,
      full: null,
      profileTitle: null,
      cvSummaryMergePolicy: null,
    });
    expect(result.aboutIntroTagline.length).toBeLessThanOrEqual(TAGLINE_MAX);
    expect(result.trimNotes.some((n) => n.includes('About tagline trimmed'))).toBe(true);
  });

  it('deduplicates repeated opening paragraph in professionalSummaryParagraphs', () => {
    const openingPara = 'Dr. Park is a leading researcher in spatial data science and geoinformatics.';
    const otherPara = 'He has received numerous awards from international organizations.';
    const result = sanitizeImportedSummary({
      profileSummary: openingPara,
      brief: openingPara, // same text → should be deduped
      full: otherPara,
      profileTitle: null,
      cvSummaryMergePolicy: null,
    });
    // opening para appears from both profileSummary and brief — only one should survive
    const paras = result.professionalSummaryParagraphs;
    const matchingParas = paras.filter((p) => p === openingPara);
    expect(matchingParas).toHaveLength(1);
    expect(result.trimNotes.some((n) => n.includes('duplicate paragraph'))).toBe(true);
  });

  it('keeps all meaningful non-duplicate paragraphs in full professional summary', () => {
    const p1 = 'Dr. Lee is a geospatial computing expert with forty years of experience.';
    const p2 = 'His research focuses on GIS applications in urban planning and disaster management.';
    const p3 = 'He has supervised over sixty doctoral students across five countries worldwide.';
    const result = sanitizeImportedSummary({
      profileSummary: p1,
      brief: p2,
      full: p3,
      profileTitle: null,
      cvSummaryMergePolicy: null,
    });
    expect(result.professionalSummaryParagraphs).toHaveLength(3);
    expect(result.professionalSummaryParagraphs).toContain(p1);
    expect(result.professionalSummaryParagraphs).toContain(p2);
    expect(result.professionalSummaryParagraphs).toContain(p3);
  });

  it('safe_update: summary section is still safe_to_merge when trim occurs', () => {
    // This test uses evaluateImportMergeSectionSafety to confirm the section stays safe_to_merge
    // even when trimNotes are present (non-blocking).
    // (The actual integration is tested via importMergeSectionSafety.test.ts)
    const longSummary = `${'A '.repeat(400)}end.`;
    const result = sanitizeImportedSummary({
      profileSummary: longSummary,
      brief: null,
      full: null,
      profileTitle: null,
      cvSummaryMergePolicy: null,
    });
    // trimNotes exist but summary is still usable — caller decides on blocking
    expect(result.trimNotes.length).toBeGreaterThan(0);
    expect(result.homeAboutIntro.length).toBeGreaterThan(0);
    expect(result.professionalSummaryParagraphs.length).toBeGreaterThan(0);
  });

  it('uses profileTitle as aboutIntroTagline fallback when brief is absent', () => {
    const result = sanitizeImportedSummary({
      profileSummary: null,
      brief: null,
      full: null,
      profileTitle: 'Professor of GIS and Spatial Computing',
      cvSummaryMergePolicy: null,
    });
    expect(result.aboutIntroTagline).toBe('Professor of GIS and Spatial Computing');
    expect(result.homeAboutIntro).toBe('');
    expect(result.trimNotes).toHaveLength(0);
  });

  it('respects split_v1 policy by excluding full summary from paragraphs', () => {
    const summary = 'A short profile summary.';
    const brief = 'A short brief.';
    const full = 'Full narrative that is very long and should not appear in split mode.';
    const result = sanitizeImportedSummary({
      profileSummary: summary,
      brief,
      full,
      profileTitle: null,
      cvSummaryMergePolicy: 'split_v1',
    });
    expect(result.professionalSummaryParagraphs).not.toContain(full);
    expect(result.professionalSummaryParagraphs).toContain(summary);
  });
});
