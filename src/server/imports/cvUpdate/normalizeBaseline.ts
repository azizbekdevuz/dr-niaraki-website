/**
 * Build / parse normalized accepted-CV baseline snapshots from Details + envelope metadata.
 * Fingerprints use semantic payloads only (no generated IDs / raw fields).
 */

import { normalizeReviewTitle } from '@/server/imports/candidateReviewIdentity';
import type {
  AcceptedCvNormalizedSnapshot,
  NormalizedListItem,
} from '@/server/imports/cvUpdate/changeSetTypes';
import {
  CV_CHANGE_ALGORITHM_VERSION,
  semanticAward,
  semanticAppointment,
  semanticEducation,
  semanticFingerprint,
  semanticPatent,
  semanticProject,
  semanticPublication,
} from '@/server/imports/cvUpdate/semanticEquality';
import { fingerprintText } from '@/server/imports/cvUpdate/truncationDetect';
import type { Details } from '@/types/details';

type EnvelopeMappingSlice = {
  sectionMappingReport?: Array<{
    normalizedTitle: string;
    mappedWebsiteSection: string | null;
    docxSectionTitle: string;
  }>;
};

function listItem(stableId: string, title: string, semanticPayload: unknown): NormalizedListItem {
  const id = stableId.trim() || semanticFingerprint(semanticPayload);
  return {
    stableId: id,
    fingerprint: semanticFingerprint(semanticPayload),
    title: title.trim(),
    payload: semanticPayload,
  };
}

export function buildAcceptedCvNormalizedSnapshot(input: {
  details: Details;
  envelope?: EnvelopeMappingSlice | null;
}): AcceptedCvNormalizedSnapshot {
  const d = input.details;
  const publications = d.publications.map((p) =>
    listItem(p.id, p.title, semanticPublication(p)),
  );
  const patents = d.patents.map((p) => listItem(p.id, p.title, semanticPatent(p)));
  const education = d.about.education.map((e) =>
    listItem(e.id, e.degree, semanticEducation(e)),
  );
  const appointments = d.about.positions.map((p) =>
    listItem(p.id, p.title, semanticAppointment(p)),
  );
  const awards = d.about.awards.map((a) => listItem(a.id, a.title, semanticAward(a)));
  const projects = d.research.projects.map((p) =>
    listItem(p.id, p.title, semanticProject(p)),
  );

  const scalars: Record<string, string | null> = {
    'profile.displayName': d.profile.name?.trim() || null,
    'profile.roleLine': d.profile.title?.trim() || null,
    'profile.summary': d.profile.summary?.trim() || null,
    'about.brief': d.about.brief?.trim() || null,
    'about.full': d.about.full?.trim() || null,
    'contact.info.email': d.contact.email?.trim() || null,
    'contact.info.personalEmail': d.contact.personalEmail?.trim() || null,
    'contact.info.phone': d.contact.phone?.trim() || null,
    'contact.info.cellPhone': d.contact.cellPhone?.trim() || null,
    'contact.info.address': d.contact.address?.trim() || null,
    'contact.info.department': d.contact.department?.trim() || null,
    'contact.info.university': d.contact.university?.trim() || null,
    'contact.info.websiteDisplay': d.contact.website?.trim() || null,
  };

  const sectionFingerprints: Record<string, string> = {
    publications: fingerprintText(publications.map((x) => x.fingerprint).join('|')),
    patents: fingerprintText(patents.map((x) => x.fingerprint).join('|')),
    education: fingerprintText(education.map((x) => x.fingerprint).join('|')),
    appointments: fingerprintText(appointments.map((x) => x.fingerprint).join('|')),
    awards: fingerprintText(awards.map((x) => x.fingerprint).join('|')),
    projects: fingerprintText(projects.map((x) => x.fingerprint).join('|')),
    profile: fingerprintText(scalars),
  };

  const sourceSectionMappings =
    input.envelope?.sectionMappingReport?.map((row) => ({
      normalizedTitle: row.normalizedTitle,
      mappedWebsiteSection: row.mappedWebsiteSection,
      title: row.docxSectionTitle,
    })) ?? [];

  return {
    schemaVersion: 1,
    algorithmVersion: CV_CHANGE_ALGORITHM_VERSION,
    scalars,
    lists: { publications, patents, education, appointments, awards, projects },
    sectionFingerprints,
    sourceSectionMappings,
  };
}

function rehydrateListItem(
  listKey: keyof AcceptedCvNormalizedSnapshot['lists'],
  item: NormalizedListItem,
): NormalizedListItem {
  const raw = item.payload;
  if (!raw || typeof raw !== 'object') {return item;}
  const row = raw as Record<string, unknown>;
  let payload: unknown;
  switch (listKey) {
    case 'publications':
      payload = semanticPublication(row);
      break;
    case 'patents':
      payload = semanticPatent(row);
      break;
    case 'education':
      payload = semanticEducation(row);
      break;
    case 'appointments':
      payload = semanticAppointment(row);
      break;
    case 'awards':
      payload = semanticAward(row);
      break;
    case 'projects':
      payload = semanticProject(row);
      break;
    default:
      return item;
  }
  return {
    ...item,
    payload,
    fingerprint: semanticFingerprint(payload),
  };
}

/**
 * Parse a stored accepted-CV snapshot and rehydrate list payloads through current
 * semantic builders (e.g. year number ↔ string) so stale baselines compare cleanly.
 */
export function parseAcceptedCvNormalizedSnapshot(input: unknown): AcceptedCvNormalizedSnapshot | null {
  if (!input || typeof input !== 'object') {return null;}
  const row = input as Partial<AcceptedCvNormalizedSnapshot>;
  if (row.schemaVersion !== 1 || !row.scalars || !row.lists || !row.sectionFingerprints) {
    return null;
  }
  const lists = row.lists;
  return {
    schemaVersion: 1,
    algorithmVersion:
      typeof row.algorithmVersion === 'number' ? row.algorithmVersion : CV_CHANGE_ALGORITHM_VERSION,
    scalars: row.scalars,
    lists: {
      publications: (lists.publications ?? []).map((item) => rehydrateListItem('publications', item)),
      patents: (lists.patents ?? []).map((item) => rehydrateListItem('patents', item)),
      education: (lists.education ?? []).map((item) => rehydrateListItem('education', item)),
      appointments: (lists.appointments ?? []).map((item) => rehydrateListItem('appointments', item)),
      awards: (lists.awards ?? []).map((item) => rehydrateListItem('awards', item)),
      projects: (lists.projects ?? []).map((item) => rehydrateListItem('projects', item)),
    },
    sectionFingerprints: row.sectionFingerprints,
    sourceSectionMappings: row.sourceSectionMappings ?? [],
  };
}

export { normalizeReviewTitle };
