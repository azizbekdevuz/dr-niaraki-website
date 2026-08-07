import { describe, expect, it } from 'vitest';

import { classifyProfessorImportWarnings } from '@/server/imports/cvUpdate/professorWarningFilter';

describe('classifyProfessorImportWarnings', () => {
  it('drops unclear title when recovery succeeded for the same index', () => {
    const result = classifyProfessorImportWarnings([
      { message: 'Publication 10: title unclear — please review', severity: 'warning' },
      {
        message: 'Publication 10: recovered truncated title from raw citation',
        severity: 'info',
      },
      { message: 'Publication 11: title unclear — please review', severity: 'warning' },
    ]);
    expect(result.active.map((w) => w.message)).toEqual([
      'Publication 11: title unclear — please review',
    ]);
    expect(result.resolvedSummary.some((s) => s.includes('automatically recovered'))).toBe(true);
  });

  it('summarizes successful deduplication as resolved', () => {
    const result = classifyProfessorImportWarnings([
      { message: 'Removed duplicate publication (kept a, dropped b)', severity: 'warning' },
    ]);
    expect(result.active).toHaveLength(0);
    expect(result.resolvedSummary[0]).toMatch(/duplicate/i);
  });

  it('keeps unclear title as active when recovery did not succeed', () => {
    const result = classifyProfessorImportWarnings([
      { message: 'Publication 3: title unclear — please review', severity: 'warning' },
    ]);
    expect(result.active).toHaveLength(1);
    expect(result.active[0]?.message).toMatch(/title unclear/);
    expect(result.resolvedSummary).toHaveLength(0);
  });

  it('does not treat Preamble as an active professor warning', () => {
    const result = classifyProfessorImportWarnings([
      { message: 'Unrecognized section: "Preamble" - please review', severity: 'warning' },
      { message: 'Publication 11: title unclear — please review', severity: 'warning' },
    ]);
    expect(result.active.map((w) => w.message)).toEqual([
      'Publication 11: title unclear — please review',
    ]);
    expect(result.resolvedSummary.some((s) => /Preamble/i.test(s))).toBe(true);
  });
});
