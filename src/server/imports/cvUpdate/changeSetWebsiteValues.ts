/**
 * Resolve website scalar / list values for three-way CV change-set comparison.
 */

import type { SiteContent } from '@/content/schema';
import type { AcceptedCvNormalizedSnapshot } from '@/server/imports/cvUpdate/changeSetTypes';
import { sanitizeImportedSummary } from '@/server/imports/summarySanitize';

function trimOrNull(value: string | null | undefined): string | null {
  const t = (value ?? '').trim();
  return t || null;
}

function summaryFromScalars(scalars: Record<string, string | null>) {
  return sanitizeImportedSummary({
    profileSummary: scalars['profile.summary'] ?? undefined,
    brief: scalars['about.brief'] ?? undefined,
    full: scalars['about.full'] ?? undefined,
    profileTitle: scalars['profile.roleLine'] ?? undefined,
    cvSummaryMergePolicy: undefined,
  });
}

export function websiteScalarValue(fieldPath: string, website: SiteContent): string | null {
  switch (fieldPath) {
    case 'profile.displayName':
      return website.profile.displayName;
    case 'profile.roleLine':
      return website.profile.roleLine;
    case 'profile.homeAboutIntro':
      return website.profile.homeAboutIntro;
    case 'profile.aboutIntroTagline':
      return website.profile.aboutIntroTagline;
    case 'about.page.professionalSummaryParagraphs':
      return website.about.page.professionalSummaryParagraphs.join('\n\n') || null;
    case 'contact.info.email':
      return website.contact.info.email;
    case 'contact.info.personalEmail':
      return website.contact.info.personalEmail;
    case 'contact.info.phone':
      return website.contact.info.phone;
    case 'contact.info.cellPhone':
      return website.contact.info.cellPhone;
    case 'contact.info.address':
      return website.contact.info.address;
    case 'contact.info.department':
      return website.contact.info.department;
    case 'contact.info.university':
      return website.contact.info.university;
    case 'contact.info.websiteDisplay':
      return website.contact.info.websiteDisplay;
    default:
      return null;
  }
}

export function snapshotScalarValue(
  fieldPath: string,
  snapshot: AcceptedCvNormalizedSnapshot | null,
): string | null {
  if (!snapshot) {return null;}
  const s = snapshot.scalars;
  switch (fieldPath) {
    case 'profile.displayName':
      return s['profile.displayName'] ?? null;
    case 'profile.roleLine':
      return s['profile.roleLine'] ?? null;
    case 'profile.homeAboutIntro':
      return trimOrNull(summaryFromScalars(s).homeAboutIntro);
    case 'profile.aboutIntroTagline':
      return trimOrNull(summaryFromScalars(s).aboutIntroTagline);
    case 'about.page.professionalSummaryParagraphs': {
      const paras = summaryFromScalars(s).professionalSummaryParagraphs;
      return paras.length ? paras.join('\n\n') : null;
    }
    case 'contact.info.email':
      return s['contact.info.email'] ?? null;
    case 'contact.info.personalEmail':
      return s['contact.info.personalEmail'] ?? null;
    case 'contact.info.phone':
      return s['contact.info.phone'] ?? null;
    case 'contact.info.cellPhone':
      return s['contact.info.cellPhone'] ?? null;
    case 'contact.info.address':
      return s['contact.info.address'] ?? null;
    case 'contact.info.department':
      return s['contact.info.department'] ?? null;
    case 'contact.info.university':
      return s['contact.info.university'] ?? null;
    case 'contact.info.websiteDisplay':
      return s['contact.info.websiteDisplay'] ?? null;
    default:
      return null;
  }
}

export function websiteListById(
  website: SiteContent,
  listKey: keyof AcceptedCvNormalizedSnapshot['lists'],
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  switch (listKey) {
    case 'publications':
      for (const row of website.publications.items) {map.set(row.id, row);}
      break;
    case 'patents':
      for (const row of website.patents.items) {map.set(row.id, row);}
      break;
    case 'education':
      for (const row of website.about.journey) {map.set(row.id, row);}
      break;
    case 'appointments':
      for (const row of website.about.experiences) {map.set(row.id, row);}
      break;
    case 'awards':
      for (const row of website.about.awards) {map.set(row.id, row);}
      break;
    case 'projects':
      for (const row of website.research.projects) {map.set(row.id, row);}
      break;
  }
  return map;
}
