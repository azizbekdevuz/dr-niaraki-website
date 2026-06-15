import { describe, expect, it } from 'vitest';

import { determinePatentStatus, determinePatentType } from '@/parser/parserPatentExtract';
import { patentStatus } from '@/server/imports/detailsMergeNormalize';

describe('determinePatentStatus', () => {
  it('maps Registration completed to registered', () => {
    expect(determinePatentStatus('Status: Registration completed')).toBe('registered');
    expect(determinePatentStatus('Patent registration completed')).toBe('registered');
  });

  it('maps Application completed to pending', () => {
    expect(determinePatentStatus('Status: Application completed')).toBe('pending');
    expect(determinePatentStatus('Patent application completed')).toBe('pending');
  });

  it('maps Registered and Granted to registered', () => {
    expect(determinePatentStatus('Registered Jan 2022')).toBe('registered');
    expect(determinePatentStatus('Patent Granted')).toBe('registered');
  });

  it('does not emit generic completed status', () => {
    expect(determinePatentStatus('Status: completed')).toBeNull();
  });

  it('maps pending application phrases to pending', () => {
    expect(determinePatentStatus('Patent Application No. 18/821,509 Pending')).toBe('pending');
    expect(determinePatentStatus('under examination')).toBe('pending');
  });
});

describe('determinePatentType', () => {
  it('classifies Korean 10- number as korean even when title contains apparatus', () => {
    const text =
      '10-2828547 – 2025-06-27 Spatial-temporal distribution analysis method and apparatus of school';
    expect(determinePatentType(text)).toBe('korean');
  });

  it('classifies explicit US international patent text as international', () => {
    const text = 'US International Patent (US11,816,804B2) - Nov 14, 2023';
    expect(determinePatentType(text)).toBe('international');
  });

  it('does not classify apparatus-of-school as international via us substring', () => {
    expect(determinePatentType('method and apparatus of school')).toBe('other');
  });
});

describe('patentStatus merge', () => {
  it('preserves registered from parser', () => {
    expect(patentStatus('registered')).toBe('registered');
  });

  it('maps legacy completed to registered only when raw proves registration completed', () => {
    expect(patentStatus('completed', 'Status: Registration completed')).toBe('registered');
    expect(patentStatus('completed', 'Status: Application completed')).toBe('unknown');
    expect(patentStatus('completed')).toBe('unknown');
  });

  it('maps pending and null to pending/unknown', () => {
    expect(patentStatus('pending')).toBe('pending');
    expect(patentStatus(null)).toBe('unknown');
    expect(patentStatus('expired')).toBe('expired');
  });

  it('maps legacy completed without registration proof to unknown', () => {
    expect(patentStatus('completed')).toBe('unknown');
    expect(patentStatus('completed', 'Status: Application completed')).toBe('unknown');
  });
});
