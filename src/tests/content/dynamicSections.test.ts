import { describe, expect, it } from 'vitest';

import { SITE_CONTENT_RAW } from '@/content/defaults';
import { SiteContentSchema } from '@/content/schema';
import { assertSiteContent, validateSiteContent } from '@/content/validators';
import {
  buildDynamicSectionFromCvText,
  mergeDynamicSectionIntoSiteContent,
  stripHtmlTags,
} from '@/server/imports/cvUpdate/dynamicSections';

describe('dynamicSections schema default', () => {
  it('defaults missing dynamicSections to []', () => {
    const legacy = structuredClone(assertSiteContent(SITE_CONTENT_RAW)) as Record<string, unknown>;
    delete legacy.dynamicSections;

    const result = validateSiteContent(legacy);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dynamicSections).toEqual([]);
    }
  });

  it('accepts a populated dynamic section', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const parsed = SiteContentSchema.safeParse({
      ...base,
      dynamicSections: [
        {
          id: 'cv-extra-skills',
          title: 'Skills',
          presentation: 'bullet_list',
          sortOrder: 10,
          items: [{ id: 'cv-extra-skills__item_1', title: 'Python' }],
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dynamicSections).toHaveLength(1);
      expect(parsed.data.dynamicSections[0]?.title).toBe('Skills');
    }
  });
});

describe('buildDynamicSectionFromCvText', () => {
  it('strips HTML and scripts from rich_text body', () => {
    const section = buildDynamicSectionFromCvText({
      id: 'sec-1',
      title: 'Notes',
      presentation: 'rich_text',
      sortOrder: 1,
      rawText: '<p>Hello</p><script>alert(1)</script><b>World</b>',
    });
    expect(section.body).toBeDefined();
    expect(section.body).not.toMatch(/<script/i);
    expect(section.body).not.toMatch(/alert/);
    expect(section.body).toContain('Hello');
    expect(section.body).toContain('World');
    expect(stripHtmlTags('<img src=x onerror=alert(1)>')).not.toMatch(/</);
  });

  it('parses bullet lines conservatively', () => {
    const section = buildDynamicSectionFromCvText({
      id: 'sec-bullets',
      title: 'Topics',
      presentation: 'bullet_list',
      sortOrder: 2,
      rawText: '- Alpha\n* Beta\n3. Gamma\nplain ignored',
    });
    expect(section.items?.map((i) => i.title)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('parses timeline date prefixes', () => {
    const section = buildDynamicSectionFromCvText({
      id: 'sec-tl',
      title: 'History',
      presentation: 'timeline',
      sortOrder: 3,
      rawText: '2019-2021: Research fellow\n2022 — Lab lead',
    });
    expect(section.items).toHaveLength(2);
    expect(section.items?.[0]?.date).toMatch(/2019/);
    expect(section.items?.[0]?.title).toContain('Research fellow');
  });

  it('falls back to body when no items parse', () => {
    const section = buildDynamicSectionFromCvText({
      id: 'sec-fallback',
      title: 'Misc',
      presentation: 'bullet_list',
      sortOrder: 4,
      rawText: 'Just a paragraph with no bullets.',
    });
    expect(section.items).toBeUndefined();
    expect(section.body).toBe('Just a paragraph with no bullets.');
  });
});

describe('mergeDynamicSectionIntoSiteContent', () => {
  it('upserts by id without mutating the original site object', () => {
    const site = assertSiteContent(SITE_CONTENT_RAW);
    const first = buildDynamicSectionFromCvText({
      id: 'dyn-a',
      title: 'A',
      presentation: 'rich_text',
      sortOrder: 2,
      rawText: 'one',
    });
    const merged = mergeDynamicSectionIntoSiteContent(site, first);
    expect(site.dynamicSections).toEqual([]);
    expect(merged.dynamicSections).toHaveLength(1);

    const updated = buildDynamicSectionFromCvText({
      id: 'dyn-a',
      title: 'A updated',
      presentation: 'rich_text',
      sortOrder: 2,
      rawText: 'two',
    });
    const second = buildDynamicSectionFromCvText({
      id: 'dyn-b',
      title: 'B',
      presentation: 'rich_text',
      sortOrder: 1,
      rawText: 'b',
    });
    const final = mergeDynamicSectionIntoSiteContent(
      mergeDynamicSectionIntoSiteContent(merged, updated),
      second,
    );
    expect(final.dynamicSections.map((s) => s.id)).toEqual(['dyn-b', 'dyn-a']);
    expect(final.dynamicSections[1]?.title).toBe('A updated');
    expect(final.dynamicSections[1]?.body).toBe('two');
  });
});
