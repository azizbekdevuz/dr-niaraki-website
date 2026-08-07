/**
 * Real-workflow change detection against bundled `docs/resume.docx`.
 * Mutates the parsed Details in memory (no modified DOCX was available in the workspace).
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
import type { DetailsSchemaType } from '@/validators/detailsSchema';

const RESUME = path.join(process.cwd(), 'docs', 'resume.docx');
const hasResume = fs.existsSync(RESUME);

function toMutableDetails(details: unknown): DetailsSchemaType {
  return JSON.parse(JSON.stringify(details)) as DetailsSchemaType;
}

function withNoiseIds(details: DetailsSchemaType): DetailsSchemaType {
  const next = toMutableDetails(details);
  next.publications = next.publications.map((p, i) => ({
    ...p,
    id: `noise-pub-${i}`,
    raw: p.raw ?? `raw-${i}`,
  }));
  next.patents = next.patents.map((p, i) => {
    let country = p.country;
    if (p.country === 'KR' || p.country === 'Korea') {
      country = i % 2 === 0 ? 'KR' : 'Korea';
    }
    // Keep enum status stable; phrase aliases are covered in semanticEquality tests.
    return {
      ...p,
      id: `noise-pat-${i}`,
      country,
      status: p.status,
      raw: null,
    };
  });
  next.about = {
    ...next.about,
    awards: next.about.awards.map((a, i) => ({
      ...a,
      id: `noise-awd-${i}`,
      details: a.details ?? null,
      raw: a.raw ?? undefined,
    })),
  };
  return next;
}

describe('real resume.docx change-set workflow', () => {
  (hasResume ? it : it.skip)(
    'identical re-parse with metadata noise yields zero list changes',
    async () => {
      const buf = fs.readFileSync(RESUME);
      const { data, warnings } = await parseDocxToDetails(buf, 'resume.docx', 'test');
      const website = assertSiteContent(SITE_CONTENT_RAW);
      const mutable = toMutableDetails(data);

      const baseline = buildAcceptedCvNormalizedSnapshot({ details: mutable });
      const noisy = withNoiseIds(mutable);

      const t0 = performance.now();
      const changeSet = generateCvChangeSet({
        importId: 'imp-resume-identical',
        candidateDetails: noisy,
        candidateEnvelope: null,
        previousBaseline: baseline,
        website,
        websiteRef: { sourceType: 'canonical' },
        fieldLocks: [],
        sectionMappings: [],
        baselineRef: null,
      });
      const elapsedMs = performance.now() - t0;

      expect(changeSet.algorithmVersion).toBe(CV_CHANGE_ALGORITHM_VERSION);
      const listItems = changeSet.items.filter((i) =>
        ['publications', 'patents', 'awards', 'projects', 'education', 'appointments'].includes(
          i.sectionKey,
        ),
      );
      expect(listItems).toHaveLength(0);
      expect(changeSet.summary.unchangedItemCount).toBeGreaterThan(50);

      const classified = classifyProfessorImportWarnings(warnings);
      expect(
        classified.active.every((w) => !/recovered truncated title/i.test(w.message)),
      ).toBe(true);
      expect(changeSet.unknownSections.every((s) => !/preamble/i.test(s.sourceTitle))).toBe(true);
      expect(elapsedMs).toBeLessThan(5_000);
    },
    60_000,
  );

  (hasResume ? it : it.skip)(
    'small realistic update yields exactly four list changes',
    async () => {
      const buf = fs.readFileSync(RESUME);
      const { data } = await parseDocxToDetails(buf, 'resume.docx', 'test');
      const website = assertSiteContent(SITE_CONTENT_RAW);
      const mutable = toMutableDetails(data);
      const baseline = buildAcceptedCvNormalizedSnapshot({ details: mutable });

      const candidate = withNoiseIds(mutable);
      const newAwardTitle = 'International GeoAI Demo Award (test)';
      const newPubTitle = 'Cross-Modal Geospatial Knowledge Graphs (test)';

      candidate.about = {
        ...candidate.about,
        awards: [
          ...candidate.about.awards,
          {
            id: 'awd-new-test',
            title: newAwardTitle,
            organization: 'IEEE',
            year: '2026',
            category: 'research',
            details: null,
            raw: null,
          },
        ],
      };

      const pendingPatent = candidate.patents.find((p) => p.status === 'pending');
      expect(pendingPatent, 'expected at least one pending patent to flip').toBeTruthy();
      const flippedPatentTitle = pendingPatent!.title;
      candidate.patents = candidate.patents.map((p) =>
        p.id === pendingPatent!.id
          ? {
              ...p,
              status: 'registered' as const,
              country: p.country === 'KR' ? 'Korea' : p.country,
            }
          : p,
      );

      const removedPub = candidate.publications[candidate.publications.length - 1]!;
      const removedTitle = removedPub.title;
      candidate.publications = [
        ...candidate.publications.slice(0, -1),
        {
          id: 'pub-new-test',
          title: newPubTitle,
          authors: 'A. Sadeghi-Niaraki',
          journal: 'Test Journal',
          year: 2026,
          volume: null,
          issue: null,
          pages: null,
          doi: null,
          link: null,
          type: 'journal',
          impactFactor: null,
          quartile: null,
          raw: null,
        },
      ];

      const changeSet = generateCvChangeSet({
        importId: 'imp-resume-small',
        candidateDetails: candidate,
        candidateEnvelope: null,
        previousBaseline: baseline,
        website,
        websiteRef: { sourceType: 'canonical' },
        fieldLocks: [],
        sectionMappings: [],
        baselineRef: null,
      });

      const listItems = changeSet.items.filter((i) =>
        ['publications', 'patents', 'awards'].includes(i.sectionKey),
      );

      expect(listItems).toHaveLength(4);
      expect(listItems.map((i) => i.kind).sort()).toEqual(
        ['added', 'added', 'modified', 'removed'].sort(),
      );

      expect(
        listItems.some(
          (i) =>
            i.kind === 'added' &&
            String((i.candidateValue as { title?: string })?.title) === newAwardTitle,
        ),
      ).toBe(true);
      expect(
        listItems.some(
          (i) =>
            i.kind === 'added' &&
            String((i.candidateValue as { title?: string })?.title) === newPubTitle,
        ),
      ).toBe(true);
      expect(
        listItems.some(
          (i) =>
            i.kind === 'modified' &&
            String((i.candidateValue as { title?: string })?.title) === flippedPatentTitle,
        ),
      ).toBe(true);
      expect(
        listItems.some(
          (i) =>
            i.kind === 'removed' &&
            String((i.previousCvValue as { title?: string })?.title) === removedTitle,
        ),
      ).toBe(true);

      const sectionKeys = changeSet.sectionSummaries.map((s) => s.sectionKey);
      expect(new Set(sectionKeys).size).toBe(sectionKeys.length);
      expect(changeSet.summary.totalChanges).toBe(changeSet.items.length);
      expect(changeSet.sectionSummaries.reduce((sum, s) => sum + s.changes, 0)).toBe(
        changeSet.items.length,
      );
    },
    60_000,
  );
});
