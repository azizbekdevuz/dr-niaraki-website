/**
 * Invited Talks unknown-section → dynamic section decision path (real DOCX fixture).
 */

import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import { parseDocxToDetails } from '@/parser/docxParser';
import { buildImportCandidatePayload } from '@/server/imports/candidatePayload/builder';
import { applyAcceptedDynamicSections } from '@/server/imports/cvUpdate/applyChangeDecisions';
import { generateCvChangeSet } from '@/server/imports/cvUpdate/changeSetGenerate';
import { buildDynamicSectionFromCvText } from '@/server/imports/cvUpdate/dynamicSections';

const DOCX = path.join(process.cwd(), 'tmp-verify', 'invited-talks.docx');
const hasDocx = fs.existsSync(DOCX);

describe('Invited Talks DOCX → dynamic section', () => {
  (hasDocx ? it : it.skip)(
    'detects Invited Talks, accepts layout, and writes one dynamicSections draft entry',
    async () => {
      const website = assertSiteContent(SITE_CONTENT_RAW);
      const publishedSnapshot = structuredClone(website);

      const { data, warnings, artifacts } = await parseDocxToDetails(
        fs.readFileSync(DOCX),
        'invited-talks.docx',
        'verify',
      );

      const envelope = buildImportCandidatePayload({
        rawDocumentText: artifacts.rawDocumentText,
        parserVersion: 'verify',
        details: data,
        sections: artifacts.sections,
        importWarnings: warnings,
      });

      const changeSet = generateCvChangeSet({
        importId: 'imp-invited',
        candidateDetails: data,
        candidateEnvelope: envelope,
        previousBaseline: null,
        website,
        websiteRef: { sourceType: 'canonical' },
        fieldLocks: [],
        sectionMappings: [],
        baselineRef: null,
      });

      const invited = changeSet.unknownSections.find((s) =>
        /invited talks/i.test(s.sourceTitle),
      );
      expect(invited, 'expected Invited Talks unknown section').toBeTruthy();
      expect(changeSet.items.some((i) => i.kind === 'new_section')).toBe(true);
      expect(changeSet.unknownSections.every((s) => !/preamble/i.test(s.sourceTitle))).toBe(true);

      const item = changeSet.items.find(
        (i) => i.kind === 'new_section' && i.itemKey === invited!.sectionId,
      );
      expect(item).toBeTruthy();

      const next = applyAcceptedDynamicSections({
        site: website,
        changeSet,
        decisions: [
          {
            changeId: item!.id,
            action: 'accept',
            editedValue: {
              title: 'Invited Talks',
              presentation: 'BULLET_LIST',
              preview: invited!.textPreview,
            },
          },
        ],
      });

      expect(next.dynamicSections).toHaveLength(1);
      expect(next.dynamicSections[0]?.title).toBe('Invited Talks');
      expect(next.dynamicSections[0]?.presentation).toBe('bullet_list');
      expect(
        String(next.dynamicSections[0]?.body ?? '') +
          JSON.stringify(next.dynamicSections[0]?.items ?? []),
      ).toMatch(/GeoAI|XR Navigation/i);
      expect(JSON.stringify(next.dynamicSections)).not.toMatch(/<script/i);

      const remembered = generateCvChangeSet({
        importId: 'imp-invited-2',
        candidateDetails: data,
        candidateEnvelope: envelope,
        previousBaseline: null,
        website: next,
        websiteRef: { sourceType: 'working_draft' },
        fieldLocks: [],
        sectionMappings: [
          {
            normalizedTitle: invited!.normalizedTitle,
            presentation: 'BULLET_LIST',
            displayTitle: 'Invited Talks',
          },
        ],
        baselineRef: null,
      });
      const needsLayout = remembered.unknownSections.filter(
        (s) => /invited talks/i.test(s.sourceTitle) && !s.rememberedPresentation,
      );
      expect(needsLayout).toHaveLength(0);

      expect(validateSiteContent(publishedSnapshot).success).toBe(true);
      expect(publishedSnapshot.dynamicSections ?? []).toEqual([]);
    },
    60_000,
  );

  it('buildDynamicSectionFromCvText strips unsafe HTML', () => {
    const section = buildDynamicSectionFromCvText({
      id: 'dyn-1',
      title: 'Invited Talks',
      presentation: 'rich_text',
      sortOrder: 0,
      rawText: 'Talk A<script>alert(1)</script>\nTalk B',
    });
    expect(JSON.stringify(section)).not.toMatch(/<script/i);
  });
});
