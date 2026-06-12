/**
 * Parser unit tests
 * Tests for publications, patents, education, and contact parsers
 */

import { describe, it, expect } from 'vitest';

import { parseContact } from '@/parser/contactParser';
import { parseEducation, parseExperience, parseAwards } from '@/parser/educationParser';
import {
  extractYear,
  extractDoi,
  extractEmails,
  extractPhoneNumbers,
  extractPatentNumber,
  generateStableId,
  normalizeWhitespace,
  isSectionHeader,
  detectSectionType,
  splitEntries,
} from '@/parser/parserUtils';
import { parsePatents } from '@/parser/patentsParser';
import { parsePublications } from '@/parser/publicationsParser';

describe('Parser Utils', () => {
  describe('extractYear', () => {
    it('should extract year from parentheses', () => {
      expect(extractYear('Published in (2024)')).toBe(2024);
      expect(extractYear('Some paper (2023) in journal')).toBe(2023);
    });

    it('should extract standalone year', () => {
      expect(extractYear('Journal Vol. 15, 2022')).toBe(2022);
    });

    it('should return null for no year', () => {
      expect(extractYear('Some text without year')).toBeNull();
    });

    it('should ignore invalid years', () => {
      expect(extractYear('Year 1800 is too old')).toBeNull();
    });
  });

  describe('extractDoi', () => {
    it('should extract DOI from text', () => {
      expect(extractDoi('DOI: 10.1016/j.jhydrol.2024.xxx')).toBe('10.1016/j.jhydrol.2024.xxx');
    });

    it('should return null when no DOI', () => {
      expect(extractDoi('No DOI here')).toBeNull();
    });
  });

  describe('extractEmails', () => {
    it('should extract email addresses', () => {
      const emails = extractEmails('Contact: john@example.com and jane@university.edu');
      expect(emails).toContain('john@example.com');
      expect(emails).toContain('jane@university.edu');
    });

    it('should return empty array when no emails', () => {
      expect(extractEmails('No emails here')).toEqual([]);
    });
  });

  describe('extractPhoneNumbers', () => {
    it('should extract phone numbers', () => {
      const phones = extractPhoneNumbers('Tel: +82-2-1234-5678');
      expect(phones.length).toBeGreaterThan(0);
    });

    it('should filter out short numbers', () => {
      const phones = extractPhoneNumbers('ID: 12345');
      expect(phones).toEqual([]);
    });
  });

  describe('extractPatentNumber', () => {
    it('should extract US patent numbers', () => {
      expect(extractPatentNumber('US Patent 11,816,804B2')).toBe('11,816,804B2');
    });

    it('should extract Korean patent numbers', () => {
      expect(extractPatentNumber('Patent No. 10-2356500')).toBe('10-2356500');
    });

    it('should extract variable-width Korean patent numbers', () => {
      expect(extractPatentNumber('Patent No. 10-22089060 (Jan 22, 2021)')).toBe('10-22089060');
    });
  });

  describe('generateStableId', () => {
    it('should generate consistent IDs', () => {
      const id1 = generateStableId('Test Publication Title', 0);
      const id2 = generateStableId('Test Publication Title', 0);
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different text', () => {
      const id1 = generateStableId('First Title', 0);
      const id2 = generateStableId('Second Title', 0);
      expect(id1).not.toBe(id2);
    });
  });

  describe('normalizeWhitespace', () => {
    it('should normalize whitespace', () => {
      expect(normalizeWhitespace('  Multiple   spaces  ')).toBe('Multiple spaces');
      expect(normalizeWhitespace('Tab\there')).toBe('Tab here');
    });

    it('should collapse multiple newlines', () => {
      expect(normalizeWhitespace('Line1\n\n\n\nLine2')).toBe('Line1\n\nLine2');
    });
  });

  describe('isSectionHeader', () => {
    it('should detect anchored section headers', () => {
      expect(isSectionHeader('EDUCATION')).toBe(true);
      expect(isSectionHeader('Publications:')).toBe(true);
      expect(isSectionHeader('Research Experience')).toBe(true);
      expect(isSectionHeader('Professional Summary')).toBe(true);
      expect(isSectionHeader('Patents (42 Registered & Completed)')).toBe(true);
    });

    it('should not treat org lines or subsection noise as headers', () => {
      expect(isSectionHeader('eXtended Reality (XR) Research Center')).toBe(false);
      expect(isSectionHeader('Registered Korean Patents')).toBe(false);
      expect(
        isSectionHeader(
          'This is a long sentence that is not a header because it is too long and does not contain any keywords',
        ),
      ).toBe(false);
    });
  });

  describe('detectSectionType', () => {
    it('should detect education sections', () => {
      expect(detectSectionType('Education and Qualifications')).toBe('education');
    });

    it('should detect experience sections', () => {
      expect(detectSectionType('Work Experience')).toBe('experience');
    });

    it('should treat academic leadership as narrative, not employment experience', () => {
      expect(detectSectionType('Academic Leadership and Supervision')).toBe('academic_narrative');
    });

    it('should detect publications sections', () => {
      expect(detectSectionType('Journal Publications')).toBe('publications');
    });

    it('should return unknown for unrecognized sections', () => {
      expect(detectSectionType('Random Header')).toBe('unknown');
    });
  });

  describe('splitEntries', () => {
    it('should split by numbers', () => {
      const text = '1. First entry\n2. Second entry with more text\n3. Third entry here';
      const entries = splitEntries(text);
      expect(entries.length).toBe(3);
    });

    it('should split by bullets', () => {
      const text = '• First bullet entry here\n• Second bullet entry here';
      const entries = splitEntries(text);
      expect(entries.length).toBe(2);
    });

    it('should split by double newlines', () => {
      const text = 'First paragraph with enough text\n\nSecond paragraph with enough text';
      const entries = splitEntries(text);
      expect(entries.length).toBe(2);
    });
  });
});

describe('Publications Parser', () => {
  it('should parse publication entries', () => {
    const text = `
    1. Razavi-Termeh, S. V., Sadeghi-Niaraki, A. (2024). "Cutting-Edge Strategies for Flood Mapping". Journal of Hydrology, Vol. 15. DOI: 10.1016/j.jhydrol.2024.xxx
    
    2. Another Author (2023). "Another Paper Title". Sustainability Journal.
    `;
    
    const result = parsePublications(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.year).toBe(2024);
  });

  it('should generate warnings for missing years', () => {
    const text = '1. Paper without a year mentioned in the text at all long enough entry';
    const result = parsePublications(text);
    expect(result.warnings.some(w => w.message.includes('year'))).toBe(true);
  });

  it('should extract DOIs', () => {
    const text = '1. Paper Title (2024). Journal Name. DOI: 10.1016/j.test.2024.001';
    const result = parsePublications(text);
    expect(result.data[0]?.doi).toBe('10.1016/j.test.2024.001');
  });
});

describe('Patents Parser', () => {
  it('should parse patent entries', () => {
    const text = `
    1. US Patent 11,816,804B2 - Nov 14, 2023
       "Tourist Accommodation Recommendation Method"
       Inventors: Abolghasem Sadeghi-Niaraki
    `;
    
    const result = parsePatents(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.country).toBe('US');
  });

  it('should detect patent status', () => {
    const text = '1. Korean Patent 10-2356500 Registered Jan 2022 - Test Patent Title';
    const result = parsePatents(text);
    expect(result.data[0]?.status).toBe('registered');
  });

  it('should detect pending patents', () => {
    const text = '1. Patent Application No. 18/821,509 Pending Aug 2024 - Test Title';
    const result = parsePatents(text);
    expect(result.data[0]?.status).toBe('pending');
  });
});

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

describe('Experience Parser', () => {
  it('should parse experience entries', () => {
    const text = `
    Associate Professor | INHA University | South Korea | 2022 - Present
    • Teaching graduate courses
    • Research supervision
    `;
    
    const result = parseExperience(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.type).toBe('academic');
  });

  it('should detect position types', () => {
    const text = 'Research Fellow | Institute of Technology | 2015 - 2020';
    const result = parseExperience(text);
    expect(result.data[0]?.type).toBe('research');
  });

  // ─── Fixture: real DOCX Professional Work Experiences structure ─────────────
  const REAL_EXPERIENCE_FIXTURE = `ACADEMIC APPOINTMENTS
Associate Professor | Department of Computer Science & Engineering, Sejong University, Seoul, South Korea
March 2017 - Present
Led cutting-edge research on advanced XR and Geo-AI technologies
Taught graduate-level courses in:
Artificial Intelligence and BigData
Human-Computer Interaction (HCI)
Supervised Master's and Ph.D. students in cross-disciplinary research projects
Research Professor | XR Metaverse Research Center, Sejong University, Seoul, South Korea
2022 - 2030
Serving as a Key Member in the Super-Realistic XR Technology Research Project
Research Professor | Mobile Virtual Reality Research Center, Sejong University, Seoul, South Korea
2017 - 2021
International Mega Research Project: Large Mobile Virtual Reality Research Center
Assistant Professor | Department of Geoinformatic Engineering, INHA University, Incheon, South Korea
March 2009 - February 2017
Designed and taught comprehensive curriculum in GIS and Spatial Modeling
International Consultant | Hancom, Inc., Seoul, South Korea
2016 - 2017
Developed strategic solutions for international markets
Visiting Professor | Department of Infrastructure Engineering, University of Melbourne, Australia
Winter 2009
Conducted research on spatial data infrastructure
Invited Researcher and Consultant | Korea geoSpatial Information & Communication (KSIC), Seoul, South Korea
August 2009 - November 2009
Led advanced GIS projects
EARLIER POSITIONS
ITS Researcher | Korea geoSpatial Information & Communication, Seoul, South Korea (Summer 2005)
GIS Manager | Road Maintenance and Transportation Organization-IT & GIS Office, Tehran (2002-2005)
Executive Manager | Bayan Computer Institute, Tehran (1996-1999)
Research Projects Experiences
Super-Realistic XR Technology Research Center | IITP, Ministry of Science and Technology, South Korea
March 2022 - February 2030
Contributed significantly to research in Real-Virtual Interconnected Metaverse
Knowledge Sharing Project (KSP) | ETRI
2016 - 2017
Facilitated international collaboration`;

  it('splits real DOCX structure into clean appointment rows only', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    // 7 academic + 3 earlier = 10 appointments; project section must be excluded
    expect(result.data.length).toBe(10);
  });

  it('does not create heading-only positions', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    const headings = result.data.filter((p) =>
      /ACADEMIC APPOINTMENTS|EARLIER POSITIONS|Research Projects/i.test(p.title),
    );
    expect(headings).toHaveLength(0);
  });

  it('does not create bullet-only or course-line positions', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    const noise = result.data.filter((p) =>
      /Artificial Intelligence|Human-Computer|Led cutting-edge|Taught graduate/i.test(p.title),
    );
    expect(noise).toHaveLength(0);
  });

  it('excludes Research Projects Experiences subsection entries', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    const projects = result.data.filter((p) =>
      /Super-Realistic XR Technology Research Center|Knowledge Sharing Project/i.test(p.title + p.institution),
    );
    expect(projects).toHaveLength(0);
  });

  it('parses month-year period on following line', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    const associate = result.data.find((p) => p.title.includes('Associate Professor'));
    expect(associate?.period).toBe('2017 - Present');
    expect(associate?.institution).toContain('Sejong University');
  });

  it('attaches bullet and detail lines to appointment, not as separate positions', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    const associate = result.data.find((p) => p.title.includes('Associate Professor'));
    expect(associate?.details).toMatch(/Led cutting-edge research/);
    expect(associate?.details).toMatch(/Taught graduate-level courses/);
  });

  it('reduces Unknown Organization rows for real-style fixture', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    const unknown = result.data.filter((p) => p.institution === 'Unknown Organization');
    expect(unknown).toHaveLength(0);
  });

  it('has few or no period unclear warnings for real-style fixture', () => {
    const result = parseExperience(REAL_EXPERIENCE_FIXTURE);
    const unclear = result.warnings.filter((w) => w.message.includes('period unclear'));
    expect(unclear.length).toBeLessThanOrEqual(1);
  });
});

describe('Awards Parser', () => {
  it('should parse award entries', () => {
    const text = `
    Best Paper Award 2023
    From International Conference on GIS
    For outstanding research contribution
    `;
    
    const result = parseAwards(text);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]?.year).toBe('2023');
  });

  it('should detect award categories', () => {
    const text = 'Excellence in Teaching Award 2022 - University Award';
    const result = parseAwards(text);
    expect(result.data[0]?.category).toBe('teaching');
  });
});

describe('Contact Parser', () => {
  it('should extract email addresses', () => {
    const text = 'Email: professor@university.edu | Personal: prof@gmail.com';
    const result = parseContact(text);
    expect(result.data.email).toBeTruthy();
  });

  it('should extract phone numbers', () => {
    const text = 'Tel: +82-2-3277-2392 | Fax: +82-2-3277-2390';
    const result = parseContact(text);
    expect(result.data.phone).toBeTruthy();
  });

  it('should detect social links', () => {
    const text = 'LinkedIn: https://linkedin.com/in/professor | ResearchGate: https://researchgate.net/profile/prof';
    const result = parseContact(text);
    expect(result.data.social.linkedin).toBeTruthy();
    expect(result.data.social.researchGate).toBeTruthy();
  });

  it('should categorize official vs personal emails', () => {
    const text = 'Contact: prof@sejong.ac.kr, personal.email@gmail.com';
    const result = parseContact(text);
    expect(result.data.email).toContain('sejong');
    expect(result.data.personalEmail).toContain('gmail');
  });

  it('should classify x.com and twitter.com URLs as twitter', () => {
    const text = 'Twitter: https://x.com/professor | Also: https://twitter.com/professor';
    const result = parseContact(text);
    expect(result.data.social.twitter).toMatch(/x\.com|twitter\.com/);
  });

  it('should not classify unrelated domains containing "x.com" substring as twitter', () => {
    const text = 'Website: https://fax.company.com/page | CV: https://example.com/x.com/path';
    const result = parseContact(text);
    expect(result.data.social.twitter).toBeUndefined();
  });
});

describe('Edge Cases', () => {
  it('should handle empty input', () => {
    expect(parsePublications('').data).toEqual([]);
    expect(parsePatents('').data).toEqual([]);
    expect(parseEducation('').data).toEqual([]);
    expect(parseExperience('').data).toEqual([]);
    expect(parseAwards('').data).toEqual([]);
  });

  it('should handle malformed entries gracefully', () => {
    const text = 'Short';
    const result = parsePublications(text);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should not crash on special characters', () => {
    const text = '1. Paper with special chars: ™ © ® € £ ¥ • – — " " \' \' (2024)';
    const result = parsePublications(text);
    expect(result.data).toBeDefined();
  });

  it('should handle Unicode text', () => {
    const text = '1. 한국어 제목 (2024). 한국 저널. Korean patent with special characters.';
    const result = parsePublications(text);
    expect(result.data).toBeDefined();
  });
});

describe('Warning Generation', () => {
  it('should generate warnings for ambiguous entries', () => {
    const text = '1. Entry without clear year or journal information - just a long text to test';
    const result = parsePublications(text);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should include entry index in warnings', () => {
    const text = '1. First entry without year longer text here\n2. Second entry also no year even longer text';
    const result = parsePublications(text);
    const warningsWithIndex = result.warnings.filter(w => w.index !== undefined);
    expect(warningsWithIndex.length).toBeGreaterThan(0);
  });
});
