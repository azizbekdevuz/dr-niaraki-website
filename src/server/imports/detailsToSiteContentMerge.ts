import type { ResearchProjectItem, SiteContent } from '@/content/schema';
import { mergeRequiredField } from '@/lib/missingValue';
import { applyCvNarrativeSectionsToSiteContent } from '@/server/imports/cvNarrativeToSimpleLists';
import {
  awardImpactFrom,
  normalizedPublicationYear,
  patentStatus,
  patentType,
  publicationType,
} from '@/server/imports/detailsMergeNormalize';
import { mergeResearchInterestsFromDetails } from '@/server/imports/detailsMergeResearchInterests';
import type { CvDetailsMergeFreezeKey } from '@/server/imports/importMergeSectionSafety';
import { sanitizeImportedSummary } from '@/server/imports/summarySanitize';
import type { DetailsSchemaType } from '@/validators/detailsSchema';

function mapDetailsResearchProjectToSite(p: DetailsSchemaType['research']['projects'][number]): ResearchProjectItem {
  const status = p.status === 'ongoing' ? 'ongoing' : 'completed';
  return {
    id: p.id.trim(),
    title: p.title.trim(),
    description: mergeRequiredField(p.description ?? p.raw),
    period: mergeRequiredField(p.period),
    funding: mergeRequiredField(p.funding),
    amount: mergeRequiredField(p.fundingAmount),
    status,
    role: mergeRequiredField(p.role),
  };
}

/**
 * Merges CV `Details` (parser output) into an existing `SiteContent` baseline.
 * Keeps non-editor slices (home, layout, meta, most research chrome) from `base` while updating
 * profile/about/contact and list-backed sections that the `/admin/content` editor cares about.
 *
 * @param opts.freeze Optional set of logical sections to keep from `base` (no import overwrite).
 */
export function mergeCvDetailsIntoSiteContent(
  details: DetailsSchemaType,
  base: SiteContent,
  opts?: { freeze?: ReadonlySet<CvDetailsMergeFreezeKey> },
): SiteContent {
  const fr = opts?.freeze ?? new Set<CvDetailsMergeFreezeKey>();
  const next: SiteContent = structuredClone(base);
  const yearCeiling = new Date().getFullYear() + 1;
  const experienceById = new Map(base.about.experiences.map((e) => [e.id.trim(), e]));

  if (!fr.has('profile')) {
    next.profile.displayName = details.profile.name.trim() || next.profile.displayName;
    next.profile.roleLine = (details.profile.title ?? next.profile.roleLine).trim() || next.profile.roleLine;
  }

  if (!fr.has('summary')) {
    const sanitized = sanitizeImportedSummary({
      profileSummary: details.profile.summary ?? undefined,
      brief: details.about.brief ?? undefined,
      full: details.about.full ?? undefined,
      profileTitle: details.profile.title ?? undefined,
      cvSummaryMergePolicy: details.meta?.cvSummaryMergePolicy ?? undefined,
    });

    const paras =
      sanitized.professionalSummaryParagraphs.length > 0
        ? sanitized.professionalSummaryParagraphs
        : next.about.page.professionalSummaryParagraphs;
    next.about.page.professionalSummaryParagraphs = paras;
    next.profile.homeAboutIntro = sanitized.homeAboutIntro || next.profile.homeAboutIntro;
    next.profile.aboutIntroTagline = sanitized.aboutIntroTagline || next.profile.aboutIntroTagline;
  }

  if (!fr.has('journey')) {
    next.about.journey = details.about.education.map((ed) => ({
      id: ed.id.trim(),
      title: ed.degree.trim(),
      institution: ed.institution.trim(),
      year: mergeRequiredField(ed.period ?? ed.year),
      details: mergeRequiredField(ed.details ?? ed.thesis ?? ed.raw),
    }));
  }

  if (!fr.has('experiences')) {
    next.about.experiences = details.about.positions.map((p) => {
      const id = p.id.trim();
      const previous = experienceById.get(id);
      return {
        id,
        position: p.title.trim(),
        institution: p.institution.trim(),
        duration: p.period.trim(),
        details: mergeRequiredField(p.details ?? p.raw),
        achievements: [...(p.achievements ?? [])],
        projects: previous?.projects?.length ? [...previous.projects] : [],
        type: p.type === 'research' || p.type === 'consulting' ? p.type : 'academic',
      };
    });
  }

  if (!fr.has('awards')) {
    next.about.awards = details.about.awards.map((a) => {
      const org = mergeRequiredField(a.organization);
      const year = mergeRequiredField(a.year);
      const detailsText = mergeRequiredField(a.details);
      return {
        id: a.id.trim(),
        title: a.title.trim(),
        organization: org,
        year,
        details: detailsText,
        impact: awardImpactFrom(a.details ?? null, a.raw ?? null, a.title, org, year),
        category: a.category === 'teaching' || a.category === 'service' ? a.category : 'research',
      };
    });
  }

  if (!fr.has('contact')) {
    const email = details.contact.email?.trim() || next.contact.info.email;
    const personal = details.contact.personalEmail?.trim() || next.contact.info.personalEmail;
    const web = details.contact.website?.trim() || next.contact.info.websiteDisplay;
    next.contact.info.email = email;
    next.contact.info.personalEmail = personal;
    next.contact.info.websiteDisplay = web;
  }

  if (!fr.has('publications')) {
    next.publications.items = details.publications.map((pub) => ({
      id: pub.id.trim(),
      title: pub.title.trim(),
      authors: mergeRequiredField(pub.authors),
      journal: mergeRequiredField(pub.journal),
      year: normalizedPublicationYear(pub.year ?? null, yearCeiling),
      type: publicationType(pub.type ?? undefined),
      impactFactor: pub.impactFactor ?? undefined,
      quartile: pub.quartile ?? undefined,
      doi: pub.doi ?? undefined,
    }));

    const pj = next.publications.items.filter((i) => i.type === 'journal').length;
    const pc = next.publications.items.filter((i) => i.type === 'conference').length;
    const pb = next.publications.items.filter((i) => i.type === 'book').length;
    const po = next.publications.items.filter((i) => i.type === 'other').length;
    next.publications.stats = {
      total: next.publications.items.length,
      journals: pj,
      conferences: pc,
      books: pb,
      others: po,
      phdAdvised: next.publications.stats.phdAdvised,
    };
  }

  if (!fr.has('patents')) {
    next.patents.items = details.patents.map((pt) => ({
      id: pt.id.trim(),
      title: pt.title.trim(),
      number: mergeRequiredField(pt.number),
      country: mergeRequiredField(pt.country),
      date: mergeRequiredField(pt.date),
      inventors: mergeRequiredField(pt.inventors),
      status: patentStatus(pt.status ?? undefined, pt.raw),
      type: patentType(pt.type ?? undefined),
    }));

    const pi = next.patents.items.filter((i) => i.type === 'international').length;
    const pk = next.patents.items.filter((i) => i.type === 'korean').length;
    const pend = next.patents.items.filter((i) => i.status === 'pending').length;
    const punknown = next.patents.items.filter((i) => i.status === 'unknown').length;
    const pexpired = next.patents.items.filter((i) => i.status === 'expired').length;
    next.patents.stats = {
      total: next.patents.items.length,
      international: pi,
      korean: pk,
      pending: pend,
      unknown: punknown,
      expired: pexpired,
    };
  }

  if (!fr.has('researchInterests')) {
    mergeResearchInterestsFromDetails(details, next);
  }
  if (!fr.has('researchProjects')) {
    next.research.projects = details.research.projects.map(mapDetailsResearchProjectToSite);
  }
  if (!fr.has('cvNarrative')) {
    applyCvNarrativeSectionsToSiteContent(details.about, next);
  }

  return next;
}
