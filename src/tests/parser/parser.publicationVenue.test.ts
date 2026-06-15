import { describe, expect, it } from 'vitest';

import { determinePublicationType, extractJournalName } from '@/parser/parserPublicationExtract';

describe('extractJournalName — APA structure', () => {
  const flood =
    'Razavi-Termeh, S. V., Sadeghi-Niaraki, A., Abba, S. I., Hussain, J., & Choi, S. M. (2025). Flood-prone area mapping using a synergistic approach with swarm intelligence and gradient boosting algorithms. Scientific Reports, 15(1), 27924. (SCIE-Q1-IF: 3.9, TOP18%)';

  it('extracts Scientific Reports without matching "mapping"', () => {
    expect(extractJournalName(flood)).toBe('Scientific Reports');
  });

  it('extracts Journal of Hydrology', () => {
    const text =
      'Author, A. (2024). Cutting-Edge Strategies for Flood Mapping. Journal of Hydrology, 15(2), 100-110.';
    expect(extractJournalName(text)).toBe('Journal of Hydrology');
  });

  it('extracts IEEE Access', () => {
    const text =
      'Author, A. (2023). Designing adaptive systems for immersive mapping tasks. IEEE Access, 11, 12345-12356.';
    expect(extractJournalName(text)).toBe('IEEE Access');
  });

  it('extracts IEEE TVCG without matching title words', () => {
    const text =
      'Bazargani, J. S., Rahimi, F., Sadeghi-Niaraki, A., & Choi, S. M. (2026). Which Strategy When? Designing an Adaptive Search System for Virtual Reality. IEEE Transactions on Visualization and Computer Graphics.';
    expect(extractJournalName(text)).toBe('IEEE Transactions on Visualization and Computer Graphics');
  });

  it('does not fabricate venue from "mapping" or "designing" inside title', () => {
    const mappingOnly =
      'Author, A. (2024). Flood-prone area mapping using a synergistic approach. (SCIE-Q1)';
    expect(extractJournalName(mappingOnly)).toBeNull();
  });

  it('extracts conference proceedings from In: pattern', () => {
    const text =
      'Trung, D.T., Sadeghi-Niaraki, A., Bazargani, J. S., & Choi, S. M. (2026, March). CoPianist: Co-Playing with a Virtual Pianist. In 2026 IEEE Conference on Virtual Reality and 3D User Interfaces Abstracts and Workshops (VRW) (pp. 1309-1310). IEEE.';
    const venue = extractJournalName(text);
    expect(venue).toMatch(/IEEE Conference on Virtual Reality/i);
  });
});

describe('determinePublicationType — books', () => {
  it('classifies VDM publisher as book', () => {
    const text =
      'Sadeghi-Niaraki, A. (2009). Ontology-based and User-centric Spatial Modeling in GIS. VDM - The Publisher, Saarbrücken, Germany.';
    expect(determinePublicationType(text)).toBe('book');
  });

  it('classifies university publication as book', () => {
    const text = 'Author (2010). Title. K.N. Toosi University Publication.';
    expect(determinePublicationType(text)).toBe('book');
  });

  it('keeps standard journal as journal', () => {
    const text = 'Author (2024). Title. Journal of Hydrology, 15(1), 1-10. (SCIE)';
    expect(determinePublicationType(text)).toBe('journal');
  });

  it('keeps conference as conference', () => {
    const text = 'Author (2024). Title. In Proceedings of the GIS Conference.';
    expect(determinePublicationType(text)).toBe('conference');
  });
});
