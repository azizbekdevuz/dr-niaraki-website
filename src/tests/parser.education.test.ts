/**
 * Education parser unit tests
 */

import { describe, it, expect } from 'vitest';

import { parseEducation } from '@/parser/educationParser';

describe('Education Parser', () => {
  it('should parse education entries', () => {
    const text = `
    Ph.D. in Geomatics Engineering
    University of Melbourne | Australia | 2008
    Thesis: "Ontology-based Spatial Modeling"
    `;
    
    const result = parseEducation(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.degree).toContain('Ph.D.');
  });

  it('should extract institution', () => {
    const text = 'M.Sc. in GIS Engineering | KNTU University | Iran | 2003';
    const result = parseEducation(text);
    expect(result.data[0]?.institution).toContain('University');
  });

  // ─── Fixture: real DOCX Academic Qualifications structure ───────────────────
  // Redacted version of the professor's CV education section.
  // Before fix: collapsed to ~2 giant rows. After fix: 5 clean rows.
  const REAL_EDUCATION_FIXTURE = `Top 2% researcher worldwide (ESI - Clarivate Analytics, Web of Science, Nov. 2023)
Post-Doctoral Fellowship | University of Melbourne | Australia | Oct 2008 - Sept 2009
Supervisor: Prof. John Smith
Post-Doctoral Fellowship | INHA University | South Korea | 2006 - 2007
Supervisor: Prof. Hee-Ju Shin
Ph.D. in Geo-Informatics Engineering | INHA University | South Korea | 2002 - 2006
Dissertation: "Spatial data quality assessment using ontology-based approaches"
Supervisor: Prof. Hee-Ju Shin
M.Sc. in GIS Engineering | K.N. Toosi University of Technology | Iran | 1999 - 2001
Thesis: "Object-oriented GIS data modeling"
B.Sc. in Geomatics-Civil Engineering | K.N. Toosi University of Technology | Iran | 1994 - 1999`;

  it('splits real DOCX structure into 5 separate education rows', () => {
    const result = parseEducation(REAL_EDUCATION_FIXTURE);
    // Recognition line should be filtered; 5 degree entries should remain.
    expect(result.data).toHaveLength(5);
  });

  it('does not classify Post-Doctoral Fellowship as Ph.D.', () => {
    const result = parseEducation(REAL_EDUCATION_FIXTURE);
    const postdocs = result.data.filter((e) => e.degree.startsWith('Post-Doctoral'));
    expect(postdocs).toHaveLength(2);
    const phd = result.data.find((e) => e.degree.includes('Ph.D.'));
    expect(phd).toBeDefined();
    expect(phd?.degree).not.toContain('Post-Doctoral');
  });

  it('extracts correct institution for each entry', () => {
    const result = parseEducation(REAL_EDUCATION_FIXTURE);
    const melbourne = result.data.find((e) => e.institution.includes('Melbourne'));
    expect(melbourne).toBeDefined();
    expect(melbourne?.institution).toBe('University of Melbourne');
    const inha = result.data.filter((e) => e.institution.includes('INHA'));
    expect(inha.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts period including Month YYYY - Month YYYY format', () => {
    const result = parseEducation(REAL_EDUCATION_FIXTURE);
    const postdocMelbourne = result.data.find((e) => e.institution?.includes('Melbourne'));
    // "Oct 2008 - Sept 2009" → period "2008 - 2009"
    expect(postdocMelbourne?.period).toBe('2008 - 2009');
  });

  it('extracts M.Sc. and B.Sc. as separate rows with correct degree labels', () => {
    const result = parseEducation(REAL_EDUCATION_FIXTURE);
    const msc = result.data.find((e) => e.degree.startsWith('M.Sc.'));
    const bsc = result.data.find((e) => e.degree.startsWith('B.Sc.'));
    expect(msc).toBeDefined();
    expect(bsc).toBeDefined();
    expect(msc?.degree).toContain('GIS Engineering');
    expect(bsc?.degree).toContain('Geomatics');
  });

  it('attaches dissertation/thesis to the correct entry', () => {
    const result = parseEducation(REAL_EDUCATION_FIXTURE);
    const phd = result.data.find((e) => e.degree.includes('Ph.D.'));
    expect(phd?.thesis).toBeTruthy();
    // Post-doc should not have a dissertation
    const postdoc = result.data.find((e) => e.institution?.includes('Melbourne'));
    expect(postdoc?.thesis).toBeNull();
  });

  it('drops recognition-only banner line and does not create an entry for it', () => {
    const result = parseEducation(REAL_EDUCATION_FIXTURE);
    const topPercent = result.data.find((e) => e.raw?.includes('Top 2%'));
    expect(topPercent).toBeUndefined();
  });

  // Production smoke: supervisor lines with PhD/MSc in professor titles must not split.
  const PRODUCTION_EDUCATION_FIXTURE = `Top 2% researcher worldwide (ESI - Clarivate Analytics, Web of Science, Nov. 2023)
Post-Doctoral Fellowship | The Department of Infrastructure Engineering, University of Melbourne, Australia
May 2012 - October 2012
Australian Endeavour Program recipient
Post-Doctoral Fellowship | INHA University, South Korea
September 2008 - February 2009
Department of Geo-Informatic Engineering
Ph.D. in Geo-Informatics Engineering | INHA University, South Korea
March 2005 - August 2008
Dissertation: "Ontology based geospatial model for personalized route finding"
PhD Supervisor: Prof. Kyehyun Kim (Renowned as the "Father of GIS" in Korea)
M.Sc. in GIS Engineering | K.N. Toosi University of Technology (KNTU)
February 2000 - November 2002
Thesis: "Defining Cost Model for Iranian Road Network in GIS"
MSc. Supervisors: Prof. Masoud Varshosaz, Prof. Ali Asghar Alesheikh
B.Sc. in Geomatics-Civil Engineering | KNTU
September 1995 - December 1999`;

  it('does not split supervisor lines containing PhD or MSc into separate rows', () => {
    const result = parseEducation(PRODUCTION_EDUCATION_FIXTURE);
    expect(result.data).toHaveLength(5);
    const supervisorOnly = result.data.filter(
      (e) => e.degree === 'Ph.D.' || e.degree === 'M.Sc.' || /^Supervisor/i.test(e.degree),
    );
    expect(supervisorOnly).toHaveLength(0);
  });

  it('attaches PhD Supervisor and MSc. Supervisors lines to parent degree entries', () => {
    const result = parseEducation(PRODUCTION_EDUCATION_FIXTURE);
    const phd = result.data.find((e) => e.degree.includes('Ph.D.'));
    const msc = result.data.find((e) => e.degree.startsWith('M.Sc.'));
    expect(phd?.supervisor).toMatch(/Kyehyun Kim/);
    expect(msc?.supervisor ?? msc?.details).toMatch(/Masoud Varshosaz/);
    const instWarnings = result.warnings.filter((w) => w.message.includes('institution not found'));
    expect(instWarnings).toHaveLength(0);
  });

  it('parses 3-part pipe line with institution+location combined and recovers period', () => {
    // Format: "Degree | Institution, Location | Month YYYY - Month YYYY" (3 pipes, no separate location slot)
    const line = 'Ph.D. in Geo-Informatics Engineering | INHA University, South Korea | March 2005 - August 2008';
    const result = parseEducation(line);
    expect(result.data).toHaveLength(1);
    const entry = result.data[0];
    expect(entry?.degree).toContain('Ph.D. in Geo-Informatics Engineering');
    // pipes[1] becomes institution (combined "Institution, Location" — acceptable, not garbage)
    expect(entry?.institution).toBe('INHA University, South Korea');
    // Period recovered via year-matching fallback even without a 4th pipe slot
    expect(entry?.period).toBe('2005 - 2008');
  });
});
