/**
 * Field ownership rules for CV import updates.
 * Website-controlled fields are never auto-overwritten.
 * Review-controlled fields require explicit acceptance.
 * CV-controlled factual lists may be prepared automatically when high-confidence.
 */

export type FieldOwnershipClass = 'website' | 'cv' | 'review';

export type FieldOwnershipRule = {
  fieldPath: string;
  ownership: FieldOwnershipClass;
  label: string;
};

/** Website prose / chrome — CV uploads must never overwrite these automatically. */
export const WEBSITE_CONTROLLED_FIELDS: readonly FieldOwnershipRule[] = [
  { fieldPath: 'home.hero.title', ownership: 'website', label: 'Hero title' },
  { fieldPath: 'home.hero.subtitle', ownership: 'website', label: 'Hero subtitle' },
  { fieldPath: 'home.hero.body', ownership: 'website', label: 'Hero body' },
  { fieldPath: 'home.aboutSectionHeading', ownership: 'website', label: 'Homepage about heading' },
  { fieldPath: 'home.aboutSectionIntro', ownership: 'website', label: 'Homepage about intro' },
  { fieldPath: 'home.researchInActionCaption', ownership: 'website', label: 'Research caption' },
  { fieldPath: 'about.page.collaborationHeading', ownership: 'website', label: 'Collaboration heading' },
  { fieldPath: 'about.page.collaborationBody', ownership: 'website', label: 'Collaboration copy' },
  { fieldPath: 'research.collaborationHeading', ownership: 'website', label: 'Research collaboration heading' },
  { fieldPath: 'research.collaborationBody', ownership: 'website', label: 'Research collaboration copy' },
  { fieldPath: 'research.heroIntro', ownership: 'website', label: 'Research hero intro' },
  { fieldPath: 'publications.heroIntro', ownership: 'website', label: 'Publications hero intro' },
  { fieldPath: 'patents.heroIntro', ownership: 'website', label: 'Patents hero intro' },
  { fieldPath: 'patents.licensingHeading', ownership: 'website', label: 'Licensing heading' },
  { fieldPath: 'patents.licensingBody', ownership: 'website', label: 'Licensing copy' },
  { fieldPath: 'contact.heroHeading', ownership: 'website', label: 'Contact hero heading' },
  { fieldPath: 'contact.heroSubtext', ownership: 'website', label: 'Contact hero subtext' },
  { fieldPath: 'layout.footer', ownership: 'website', label: 'Footer / navigation labels' },
  { fieldPath: 'meta', ownership: 'website', label: 'SEO metadata' },
] as const;

/** Identity / prominent prose — CV may propose; website preserved until accepted. */
export const REVIEW_CONTROLLED_FIELDS: readonly FieldOwnershipRule[] = [
  { fieldPath: 'profile.displayName', ownership: 'review', label: 'Display name' },
  { fieldPath: 'profile.roleLine', ownership: 'review', label: 'Professional title' },
  { fieldPath: 'profile.homeAboutIntro', ownership: 'review', label: 'Short introduction' },
  { fieldPath: 'profile.aboutIntroTagline', ownership: 'review', label: 'About tagline' },
  { fieldPath: 'about.page.professionalSummaryParagraphs', ownership: 'review', label: 'Professional summary' },
  { fieldPath: 'contact.info.email', ownership: 'review', label: 'Email' },
  { fieldPath: 'contact.info.personalEmail', ownership: 'review', label: 'Personal email' },
  { fieldPath: 'contact.info.phone', ownership: 'review', label: 'Phone' },
  { fieldPath: 'contact.info.cellPhone', ownership: 'review', label: 'Mobile' },
  { fieldPath: 'contact.info.address', ownership: 'review', label: 'Address' },
  { fieldPath: 'contact.info.department', ownership: 'review', label: 'Department' },
  { fieldPath: 'contact.info.university', ownership: 'review', label: 'University' },
  { fieldPath: 'contact.info.websiteDisplay', ownership: 'review', label: 'Website' },
] as const;

/** Factual CV lists — high-confidence changes may be prepared automatically. */
export const CV_CONTROLLED_SECTIONS: readonly FieldOwnershipRule[] = [
  { fieldPath: 'publications.items', ownership: 'cv', label: 'Publications' },
  { fieldPath: 'patents.items', ownership: 'cv', label: 'Patents' },
  { fieldPath: 'about.journey', ownership: 'cv', label: 'Education' },
  { fieldPath: 'about.experiences', ownership: 'cv', label: 'Appointments' },
  { fieldPath: 'about.awards', ownership: 'cv', label: 'Awards' },
  { fieldPath: 'research.projects', ownership: 'cv', label: 'Projects' },
  { fieldPath: 'research.interests', ownership: 'cv', label: 'Research interests' },
  { fieldPath: 'teaching', ownership: 'cv', label: 'Teaching' },
  { fieldPath: 'supervision', ownership: 'cv', label: 'Supervision' },
  { fieldPath: 'service', ownership: 'cv', label: 'Service' },
] as const;

const OWNERSHIP_BY_PATH = new Map<string, FieldOwnershipClass>([
  ...WEBSITE_CONTROLLED_FIELDS.map((r) => [r.fieldPath, r.ownership] as const),
  ...REVIEW_CONTROLLED_FIELDS.map((r) => [r.fieldPath, r.ownership] as const),
  ...CV_CONTROLLED_SECTIONS.map((r) => [r.fieldPath, r.ownership] as const),
]);

export function ownershipForFieldPath(fieldPath: string): FieldOwnershipClass {
  const exact = OWNERSHIP_BY_PATH.get(fieldPath);
  if (exact) {return exact;}
  for (const [path, ownership] of OWNERSHIP_BY_PATH) {
    if (fieldPath === path || fieldPath.startsWith(`${path}.`) || fieldPath.startsWith(`${path}[`)) {
      return ownership;
    }
  }
  // Unknown scalar defaults to review; unknown lists default to cv-controlled review of adds/removes.
  if (
    fieldPath.startsWith('publications.') ||
    fieldPath.startsWith('patents.') ||
    fieldPath.startsWith('about.journey') ||
    fieldPath.startsWith('about.experiences') ||
    fieldPath.startsWith('about.awards') ||
    fieldPath.startsWith('research.projects')
  ) {
    return 'cv';
  }
  if (fieldPath.startsWith('home.') || fieldPath.startsWith('layout.') || fieldPath.startsWith('meta.')) {
    return 'website';
  }
  return 'review';
}

export function isWebsiteControlledPath(fieldPath: string): boolean {
  return ownershipForFieldPath(fieldPath) === 'website';
}
