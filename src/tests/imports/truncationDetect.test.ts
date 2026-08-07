import { describe, expect, it } from 'vitest';

import {
  detectTruncatedCandidate,
  fingerprintText,
} from '@/server/imports/cvUpdate/truncationDetect';

describe('detectTruncatedCandidate', () => {
  it('flags empty candidate when website has a value', () => {
    const v = detectTruncatedCandidate('Curated website prose.', '');
    expect(v.truncated).toBe(true);
    expect(v.reason).toMatch(/empty/i);
  });

  it('flags mid-word hyphen cutoff', () => {
    const v = detectTruncatedCandidate(
      'Research interests include spatial computing and AI.',
      'Research interests include spatia-',
    );
    expect(v.truncated).toBe(true);
    expect(v.reason).toMatch(/mid-word/i);
  });

  it('flags incomplete final word ending in Pro', () => {
    const v = detectTruncatedCandidate(
      'Associate Professor at Sejong University.',
      'Associate Pro',
    );
    expect(v.truncated).toBe(true);
    expect(v.reason).toMatch(/incomplete word/i);
    expect(v.reason).toMatch(/Pro/);
  });

  it('flags mid-sentence punctuation cutoff', () => {
    const v = detectTruncatedCandidate(
      'A long curated introduction about research and teaching.',
      'A long curated introduction about research,',
    );
    expect(v.truncated).toBe(true);
    expect(v.reason).toMatch(/mid-sentence/i);
  });

  it('flags identity downgrade when candidate tokens are a shorter subset', () => {
    const v = detectTruncatedCandidate(
      'Dr Eng Abolghasem Sadeghi Niaraki',
      'Dr Abolghasem Sadeghi',
    );
    expect(v.truncated).toBe(true);
    expect(v.reason).toMatch(/shortened identity/i);
  });

  it('flags dramatic length collapse against a long website value', () => {
    const website =
      'A distinguished researcher and educator dedicated to advancing the frontiers of Extended Reality and Artificial Intelligence in academic and industrial settings with many years of experience.';
    const v = detectTruncatedCandidate(website, 'Research interests include spatia');
    expect(v.truncated).toBe(true);
    expect(v.reason).toMatch(/substantially shorter/i);
  });

  it('flags connective cutoff when candidate is shorter', () => {
    const website =
      'Dedicated researcher working across geospatial intelligence and immersive systems for cities and industry partners worldwide.';
    const v = detectTruncatedCandidate(website, 'Dedicated researcher working across geospatial intelligence and');
    expect(v.truncated).toBe(true);
    expect(v.reason).toMatch(/connective/i);
  });

  it('returns not truncated for identical values', () => {
    const v = detectTruncatedCandidate('Same text', 'Same text');
    expect(v).toEqual({ truncated: false, reason: null });
  });

  it('returns not truncated for a normal non-downgrade edit', () => {
    const v = detectTruncatedCandidate(
      'Associate Professor at Sejong University.',
      'Full Professor at Sejong University focusing on Geo-AI.',
    );
    expect(v.truncated).toBe(false);
    expect(v.reason).toBeNull();
  });
});

describe('fingerprintText', () => {
  it('is stable for whitespace-normalized equal strings', () => {
    expect(fingerprintText('  Hello   World  ')).toBe(fingerprintText('Hello World'));
  });

  it('differs for materially different strings', () => {
    expect(fingerprintText('Dr Abolghasem Sadeghi')).not.toBe(
      fingerprintText('Dr. Eng. Abolghasem Sadeghi-Niaraki'),
    );
  });
});
