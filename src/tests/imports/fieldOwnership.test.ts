import { describe, expect, it } from 'vitest';

import {
  isWebsiteControlledPath,
  ownershipForFieldPath,
} from '@/server/imports/cvUpdate/fieldOwnership';

describe('ownershipForFieldPath', () => {
  it('classifies website-controlled chrome paths', () => {
    expect(ownershipForFieldPath('home.hero.title')).toBe('website');
    expect(ownershipForFieldPath('layout.footer')).toBe('website');
    expect(ownershipForFieldPath('meta')).toBe('website');
    expect(ownershipForFieldPath('home.aboutSectionIntro')).toBe('website');
    expect(isWebsiteControlledPath('publications.heroIntro')).toBe(true);
  });

  it('classifies review-controlled identity and contact paths', () => {
    expect(ownershipForFieldPath('profile.displayName')).toBe('review');
    expect(ownershipForFieldPath('profile.homeAboutIntro')).toBe('review');
    expect(ownershipForFieldPath('about.page.professionalSummaryParagraphs')).toBe('review');
    expect(ownershipForFieldPath('contact.info.email')).toBe('review');
  });

  it('classifies CV-controlled factual list roots and nested item paths', () => {
    expect(ownershipForFieldPath('publications.items')).toBe('cv');
    expect(ownershipForFieldPath('publications.items[0].title')).toBe('cv');
    expect(ownershipForFieldPath('patents.items')).toBe('cv');
    expect(ownershipForFieldPath('about.awards')).toBe('cv');
    expect(ownershipForFieldPath('research.projects')).toBe('cv');
    expect(ownershipForFieldPath('about.journey.ed1')).toBe('cv');
  });

  it('defaults unknown paths to review, with website prefix fallback', () => {
    expect(ownershipForFieldPath('some.unknown.scalar')).toBe('review');
    expect(ownershipForFieldPath('home.customBanner')).toBe('website');
    expect(ownershipForFieldPath('layout.navLabel')).toBe('website');
  });
});
