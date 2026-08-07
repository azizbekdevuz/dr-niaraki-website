import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent } from '@/content/validators';
import {
  applyAcceptedChangePatches,
  applyAcceptedDynamicSections,
  resolveOwnershipFreezesFromChangeSet,
} from '@/server/imports/cvUpdate/applyChangeDecisions';
import type { CvChangeSet } from '@/server/imports/cvUpdate/changeSetTypes';
import { CV_CHANGE_ALGORITHM_VERSION } from '@/server/imports/cvUpdate/semanticEquality';

function miniChangeSet(items: CvChangeSet['items']): CvChangeSet {
  return {
    schemaVersion: 1,
    algorithmVersion: CV_CHANGE_ALGORITHM_VERSION,
    generatedAt: '2026-08-06T00:00:00.000Z',
    importId: 'imp-1',
    candidateSourceTextHash: null,
    baseline: null,
    website: { sourceType: 'canonical' },
    summary: {
      totalChanges: items.length,
      safelyPrepared: items.filter((i) => i.safelyPrepared).length,
      requiresReview: items.filter((i) => i.requiresReview).length,
      unchangedItemCount: 0,
      noWebsiteRelevantChanges: items.length === 0,
    },
    sectionSummaries: [],
    items,
    unknownSections: [],
    changeSetRevision: 'abc',
  };
}

describe('resolveOwnershipFreezesFromChangeSet', () => {
  it('keeps base freezes only when no change set', () => {
    const freezes = resolveOwnershipFreezesFromChangeSet({
      changeSet: null,
      decisions: [],
      baseFreezes: new Set(['patents']),
    });
    expect([...freezes]).toEqual(['patents']);
  });

  it('freezes all list sections when a change set exists', () => {
    const changeSet = miniChangeSet([
      {
        id: 'c1',
        sectionKey: 'profile',
        fieldPath: 'profile.displayName',
        kind: 'truncated_candidate',
        ownership: 'review',
        safelyPrepared: false,
        requiresReview: true,
        label: 'Display name',
        summary: 'downgrade',
        warnings: [],
      },
    ]);
    const freezes = resolveOwnershipFreezesFromChangeSet({
      changeSet,
      decisions: [],
      baseFreezes: new Set(),
    });

    expect(freezes.has('profile')).toBe(true);
    expect(freezes.has('summary')).toBe(true);
    expect(freezes.has('contact')).toBe(true);
    expect(freezes.has('publications')).toBe(true);
    expect(freezes.has('patents')).toBe(true);
    expect(freezes.has('awards')).toBe(true);
    expect(freezes.has('researchProjects')).toBe(true);
    expect(freezes.has('journey')).toBe(true);
    expect(freezes.has('experiences')).toBe(true);

    // Decisions do not lift list freezes — accepted values are applied as precise patches.
    const stillFrozen = resolveOwnershipFreezesFromChangeSet({
      changeSet,
      decisions: [{ changeId: 'c1', action: 'accept' }],
      baseFreezes: new Set(),
    });
    expect(stillFrozen.has('profile')).toBe(true);
    expect(stillFrozen.has('awards')).toBe(true);
  });
});

describe('applyAcceptedChangePatches', () => {
  it('applies only the accepted award add and ignores the other', () => {
    const site = assertSiteContent(SITE_CONTENT_RAW);
    const beforeCount = site.about.awards.length;
    const changeSet = miniChangeSet([
      {
        id: 'awd-accept',
        sectionKey: 'awards',
        fieldPath: 'about.awards',
        itemKey: 'new-1',
        kind: 'added',
        ownership: 'cv',
        safelyPrepared: true,
        requiresReview: false,
        label: 'Awards: Accepted New Award',
        summary: 'New item',
        candidateValue: {
          title: 'Accepted New Award',
          organization: 'IEEE',
          year: '2024',
          details: null,
        },
        warnings: [],
      },
      {
        id: 'awd-ignore',
        sectionKey: 'awards',
        fieldPath: 'about.awards',
        itemKey: 'new-2',
        kind: 'added',
        ownership: 'cv',
        safelyPrepared: true,
        requiresReview: false,
        label: 'Awards: Ignored New Award',
        summary: 'New item',
        candidateValue: {
          title: 'Ignored New Award',
          organization: 'ACM',
          year: '2024',
          details: null,
        },
        warnings: [],
      },
    ]);

    const next = applyAcceptedChangePatches({
      site,
      changeSet,
      decisions: [
        { changeId: 'awd-accept', action: 'accept' },
        { changeId: 'awd-ignore', action: 'ignore' },
      ],
    });

    expect(next.about.awards).toHaveLength(beforeCount + 1);
    expect(next.about.awards.some((a) => a.title === 'Accepted New Award')).toBe(true);
    expect(next.about.awards.some((a) => a.title === 'Ignored New Award')).toBe(false);
    expect(site.about.awards).toHaveLength(beforeCount);
  });

  it('does not apply truncated display name without an explicit edit', () => {
    const site = assertSiteContent(SITE_CONTENT_RAW);
    const originalName = site.profile.displayName;
    const truncated = 'Dr. Abolghasem Sadeghi';
    const changeSet = miniChangeSet([
      {
        id: 'name-trunc',
        sectionKey: 'profile',
        fieldPath: 'profile.displayName',
        kind: 'truncated_candidate',
        ownership: 'review',
        safelyPrepared: false,
        requiresReview: true,
        label: 'Display name',
        summary: 'truncated',
        candidateValue: truncated,
        warnings: ['truncated'],
      },
    ]);

    const withoutDecision = applyAcceptedChangePatches({
      site,
      changeSet,
      decisions: [],
    });
    expect(withoutDecision.profile.displayName).toBe(originalName);

    const bareAccept = applyAcceptedChangePatches({
      site,
      changeSet,
      decisions: [{ changeId: 'name-trunc', action: 'accept' }],
    });
    expect(bareAccept.profile.displayName).toBe(originalName);

    const withEdit = applyAcceptedChangePatches({
      site,
      changeSet,
      decisions: [
        {
          changeId: 'name-trunc',
          action: 'edit',
          editedValue: 'Dr. Eng. Abolghasem Sadeghi-Niaraki',
        },
      ],
    });
    expect(withEdit.profile.displayName).toBe('Dr. Eng. Abolghasem Sadeghi-Niaraki');
  });

  it('keeps curated name/intro while applying an accepted unrelated award', () => {
    const site = assertSiteContent(SITE_CONTENT_RAW);
    const curatedName = 'Dr. Eng. Abolghasem Sadeghi-Niaraki';
    const completeIntro =
      'Dr. Abolghasem Sadeghi-Niaraki is an Associate Professor in the Department of Computer Science and Engineering at Sejong University. From 2009 to 2017, he served as an Assistant Professor.';
    site.profile.displayName = curatedName;
    site.profile.homeAboutIntro = completeIntro;
    const beforeAwards = site.about.awards.length;

    const changeSet = miniChangeSet([
      {
        id: 'name-trunc',
        sectionKey: 'profile',
        fieldPath: 'profile.displayName',
        kind: 'truncated_candidate',
        ownership: 'review',
        safelyPrepared: false,
        requiresReview: true,
        label: 'Display name',
        summary: 'truncated',
        candidateValue: 'Dr. Abolghasem Sadeghi',
        warnings: ['truncated'],
      },
      {
        id: 'intro-trunc',
        sectionKey: 'summary',
        fieldPath: 'profile.homeAboutIntro',
        kind: 'truncated_candidate',
        ownership: 'review',
        safelyPrepared: false,
        requiresReview: true,
        label: 'Short introduction',
        summary: 'truncated',
        candidateValue: `${completeIntro.slice(0, 40)} Assistant Pro`,
        warnings: ['truncated'],
      },
      {
        id: 'awd-accept',
        sectionKey: 'awards',
        fieldPath: 'about.awards',
        itemKey: 'new-1',
        kind: 'added',
        ownership: 'cv',
        safelyPrepared: true,
        requiresReview: false,
        label: 'Awards: Mixed Case Award',
        summary: 'New item',
        candidateValue: {
          title: 'Mixed Case Award',
          organization: 'IEEE',
          year: '2026',
          details: null,
        },
        warnings: [],
      },
    ]);

    const next = applyAcceptedChangePatches({
      site,
      changeSet,
      decisions: [{ changeId: 'awd-accept', action: 'accept' }],
    });

    expect(next.profile.displayName).toBe(curatedName);
    expect(next.profile.homeAboutIntro).toBe(completeIntro);
    expect(next.about.awards).toHaveLength(beforeAwards + 1);
    expect(next.about.awards.some((a) => a.title === 'Mixed Case Award')).toBe(true);
  });
});

describe('applyAcceptedDynamicSections', () => {
  it('adds accepted unknown section to draft only', () => {
    const site = assertSiteContent(SITE_CONTENT_RAW);
    const changeSet = miniChangeSet([
      {
        id: 'u1',
        sectionKey: 'unknown_section',
        fieldPath: 'unknownSections.sec-1',
        itemKey: 'sec-1',
        kind: 'new_section',
        ownership: 'review',
        safelyPrepared: false,
        requiresReview: true,
        label: 'Unknown section',
        summary: 'Invited Talks',
        candidateValue: { title: 'Invited Talks', preview: '- Talk A\n- Talk B' },
        warnings: [],
      },
    ]);
    const next = applyAcceptedDynamicSections({
      site,
      changeSet,
      decisions: [
        {
          changeId: 'u1',
          action: 'accept',
          editedValue: {
            title: 'Invited Talks',
            presentation: 'BULLET_LIST',
            preview: '- Talk A\n- Talk B',
          },
        },
      ],
    });
    expect(next.dynamicSections).toHaveLength(1);
    expect(next.dynamicSections[0]?.title).toBe('Invited Talks');
    expect(site.dynamicSections).toEqual([]);
  });
});
