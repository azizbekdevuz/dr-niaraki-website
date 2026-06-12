import type { SectionType, DetectedSection } from '@/types/parser';

import { classifyCvSectionBoundary } from './cvSectionBoundaries';

/**
 * True when the line starts a top-level CV section (anchored rules — see cvSectionBoundaries).
 */
export function isSectionHeader(text: string): boolean {
  return classifyCvSectionBoundary(text) !== null;
}

/** Section type for a boundary line (unknown if not a boundary). */
export function detectSectionType(text: string): SectionType {
  return classifyCvSectionBoundary(text) ?? 'unknown';
}

/**
 * Splits text into sections based on detected headers
 */
export function splitIntoSections(text: string): DetectedSection[] {
  const lines = text.split('\n');
  const sections: DetectedSection[] = [];
  let currentSection: DetectedSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length > 0 && isSectionHeader(trimmed)) {
      if (currentSection) {
        sections.push({
          ...currentSection,
          content: currentContent.join('\n').trim(),
        });
      } else if (currentContent.length > 0) {
        sections.push({
          type: 'unknown',
          title: 'Preamble',
          content: currentContent.join('\n').trim(),
          confidence: 0.35,
        });
      }

      const sectionType = detectSectionType(trimmed);
      currentSection = {
        type: sectionType,
        title: trimmed,
        content: '',
        confidence: sectionType === 'unknown' ? 0.5 : 0.85,
      };
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections.push({
      ...currentSection,
      content: currentContent.join('\n').trim(),
    });
  } else if (currentContent.length > 0) {
    sections.push({
      type: 'unknown',
      title: 'Preamble',
      content: currentContent.join('\n').trim(),
      confidence: 0.35,
    });
  }

  return sections;
}
