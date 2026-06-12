/**
 * Experience parser unit tests
 */

import { describe, it, expect } from 'vitest';

import { parseExperience } from '@/parser/educationParser';

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
