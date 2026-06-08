import type { DetailsSchemaType } from '@/validators/detailsSchema';

/** Shared minimal `Details` fixture for import / merge tests (not a Vitest file — safe to import from multiple `*.test.ts` files). */
export function minimalImportDetails(overrides: Partial<DetailsSchemaType> = {}): DetailsSchemaType {
  const base: DetailsSchemaType = {
    profile: {
      name: 'Dr X',
      title: 'Prof',
      photoUrl: null,
      summary: null,
      meta: null,
    },
    about: {
      brief: null,
      full: null,
      education: [],
      positions: [],
      awards: [],
      languages: [],
      cvNarrativeSections: [],
    },
    research: { interests: [], projects: [], grants: [] },
    publications: [],
    patents: [],
    contact: {
      email: 'x@y.com',
      personalEmail: null,
      phone: null,
      fax: null,
      cellPhone: null,
      address: null,
      department: null,
      university: null,
      website: null,
      cvUrl: null,
      social: {},
    },
    rawHtml: null,
    counts: {
      publications: 0,
      patents: 0,
      projects: 0,
      awards: 0,
      students: 0,
    },
    meta: {
      sourceFileName: 'f.docx',
      parsedAt: '2026-01-01T00:00:00.000Z',
      parserVersion: 't',
      commitSha: null,
      uploader: null,
      warnings: [],
    },
  };
  return { ...base, ...overrides };
}
