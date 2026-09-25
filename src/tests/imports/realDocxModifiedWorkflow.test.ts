/**
 * Final pre-commit verification: real DOCX → parse → change-set (no in-memory mutation).
 * Uses Downloads copies staged under tmp-verify/.
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
import { CV_CHANGE_ALGORITHM_VERSION } from '@/server/imports/cvUpdate/semanticEquality';

const ROOT = path.join(process.cwd(), 'tmp-verify');
const ORIGINAL = path.join(ROOT, 'original-accepted.docx');
const MODIFIED = path.join(ROOT, 'modified-test.docx');
const hasPair = fs.existsSync(ORIGINAL) && fs.existsSync(MODIFIED);

describe('real DOCX modified workflow (no in-memory mutation)', () => {
  (hasPair ? it : it.skip)(
    'prints exact professor-facing changes from actual DOCX pair',
    async () => {
      const website = assertSiteContent(SITE_CONTENT_RAW);

      const tParseOrig = performance.now();
      const orig = await parseDocxToDetails(
        fs.readFileSync(ORIGINAL),
        'original-accepted.docx',
        'verify',
      );
      const parseOrigMs = performance.now() - tParseOrig;

      const tParseMod = performance.now();
      const mod = await parseDocxToDetails(
        fs.readFileSync(MODIFIED),
        'modified-test.docx',
        'verify',
      );
      const parseModMs = performance.now() - tParseMod;

      const baseline = buildAcceptedCvNormalizedSnapshot({ details: orig.data });

      const tCs = performance.now();
      const changeSet = generateCvChangeSet({
        importId: 'verify-real-docx',
        candidateDetails: mod.data,
        candidateEnvelope: null,
        previousBaseline: baseline,
        website,
        websiteRef: { sourceType: 'canonical' },
        fieldLocks: [],
        sectionMappings: [],
        baselineRef: null,
      });
      const changeSetMs = performance.now() - tCs;

      const listItems = changeSet.items.filter((i) =>
        ['publications', 'patents', 'awards', 'projects', 'education', 'appointments'].includes(
          i.sectionKey,
        ),
      );
      const visible = changeSet.items.filter((i) => i.kind !== 'unchanged');

      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify(
          {
            algorithmVersion: changeSet.algorithmVersion,
            timingsMs: {
              parseOriginal: Math.round(parseOrigMs),
              parseModified: Math.round(parseModMs),
              changeSetGenerate: Math.round(changeSetMs),
            },
            counts: {
              origAwards: orig.data.about.awards.length,
              modAwards: mod.data.about.awards.length,
              origPatents: orig.data.patents.length,
              modPatents: mod.data.patents.length,
              origPubs: orig.data.publications.length,
              modPubs: mod.data.publications.length,
              totalVisible: visible.length,
              listVisible: listItems.length,
              summary: changeSet.summary,
            },
            items: visible.map((i) => ({
              id: i.id,
              sectionKey: i.sectionKey,
              kind: i.kind,
              label: i.label,
              previous: i.previousCvValue,
              candidate: i.candidateValue,
              website: i.websiteValue,
              safelyPrepared: i.safelyPrepared,
              requiresReview: i.requiresReview,
            })),
            unknownSections: changeSet.unknownSections,
            warningsActive: classifyProfessorImportWarnings(mod.warnings).active.map((w) => w.message),
            warningsResolved: classifyProfessorImportWarnings(mod.warnings).resolvedSummary,
          },
          null,
          2,
        ),
      );

      expect(changeSet.algorithmVersion).toBe(CV_CHANGE_ALGORITHM_VERSION);
      expect(changeSet.unknownSections.every((s) => !/preamble/i.test(s.sourceTitle))).toBe(true);
      // Soft expectation: document what we got; hard-fail only if hundreds of false positives.
      expect(listItems.length).toBeLessThan(20);
    },
    120_000,
  );
});
