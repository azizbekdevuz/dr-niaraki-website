/**
 * Compare docs/resume.docx (bundled baseline) vs Downloads candidates via real DOCX parse.
 */

import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent } from '@/content/validators';
import { parseDocxToDetails } from '@/parser/docxParser';
import { generateCvChangeSet } from '@/server/imports/cvUpdate/changeSetGenerate';
import { buildAcceptedCvNormalizedSnapshot } from '@/server/imports/cvUpdate/normalizeBaseline';
import { classifyProfessorImportWarnings } from '@/server/imports/cvUpdate/professorWarningFilter';

const ROOT = path.join(process.cwd(), 'tmp-verify');
const BASELINE = path.join(ROOT, 'baseline-docs-resume.docx');
const CANDIDATE_A = path.join(ROOT, 'candidate-may14.docx');
const CANDIDATE_B = path.join(ROOT, 'candidate-test.docx');

async function runPair(label: string, baselinePath: string, candidatePath: string) {
  const website = assertSiteContent(SITE_CONTENT_RAW);
  const t0 = performance.now();
  const base = await parseDocxToDetails(fs.readFileSync(baselinePath), path.basename(baselinePath), 'verify');
  const t1 = performance.now();
  const cand = await parseDocxToDetails(fs.readFileSync(candidatePath), path.basename(candidatePath), 'verify');
  const t2 = performance.now();
  const changeSet = generateCvChangeSet({
    importId: `verify-${label}`,
    candidateDetails: cand.data,
    candidateEnvelope: null,
    previousBaseline: buildAcceptedCvNormalizedSnapshot({ details: base.data }),
    website,
    websiteRef: { sourceType: 'canonical' },
    fieldLocks: [],
    sectionMappings: [],
    baselineRef: null,
  });
  const t3 = performance.now();
  const listItems = changeSet.items.filter((i) =>
    ['publications', 'patents', 'awards'].includes(i.sectionKey),
  );
  const classified = classifyProfessorImportWarnings(cand.warnings);
  const report = {
    label,
    timingsMs: {
      parseBaseline: Math.round(t1 - t0),
      parseCandidate: Math.round(t2 - t1),
      changeSet: Math.round(t3 - t2),
    },
    counts: {
      awards: [base.data.about.awards.length, cand.data.about.awards.length],
      patents: [base.data.patents.length, cand.data.patents.length],
      pubs: [base.data.publications.length, cand.data.publications.length],
      totalVisible: changeSet.items.length,
      listVisible: listItems.length,
      summary: changeSet.summary,
    },
    listItems: listItems.map((i) => ({
      id: i.id,
      kind: i.kind,
      label: i.label,
      previous: i.previousCvValue,
      candidate: i.candidateValue,
    })),
    scalarKinds: changeSet.items
      .filter((i) => !['publications', 'patents', 'awards'].includes(i.sectionKey))
      .map((i) => ({ id: i.id, kind: i.kind, label: i.label })),
    unknownSections: changeSet.unknownSections,
    warningsActive: classified.active.map((w) => w.message),
    warningsResolved: classified.resolvedSummary,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  return report;
}

describe('real DOCX baseline docs/resume vs Downloads candidates', () => {
  const ready = fs.existsSync(BASELINE) && fs.existsSync(CANDIDATE_A);

  (ready ? it : it.skip)(
    'docs/resume → May14 Downloads candidate',
    async () => {
      const report = await runPair('docs-vs-may14', BASELINE, CANDIDATE_A);
      expect(report.unknownSections.every((s) => !/preamble/i.test(s.sourceTitle))).toBe(true);
      expect(report.listItems).toHaveLength(4);
      expect(report.listItems.map((i) => i.kind).sort()).toEqual([
        'added',
        'added',
        'added',
        'added',
      ]);
      expect(report.warningsActive.every((m) => !/Preamble/i.test(m))).toBe(true);
      expect(report.warningsResolved.some((s) => /recovered/i.test(s))).toBe(true);
    },
    180_000,
  );

  (ready && fs.existsSync(CANDIDATE_B) ? it : it.skip)(
    'docs/resume → test.docx Downloads candidate',
    async () => {
      const report = await runPair('docs-vs-test', BASELINE, CANDIDATE_B);
      expect(report.listItems.length).toBeLessThan(30);
    },
    180_000,
  );
});
