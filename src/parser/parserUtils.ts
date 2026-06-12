/**
 * Parser utility functions for DOCX parsing
 * Provides helpers for text normalization, ID generation, and pattern matching
 */

export { normalizeWhitespace } from './parserNormalize';
export { generateStableId } from './parserStableId';
export { extractYear } from './parserYearExtract';
export { extractDoi, extractJournalName, extractAuthors, determinePublicationType } from './parserPublicationExtract';
export { extractEmails, extractPhoneNumbers, extractUrls } from './parserContactExtract';
export { extractPatentNumber, determinePatentStatus, determinePatentType } from './parserPatentExtract';
export { isSectionHeader, detectSectionType, splitIntoSections } from './parserSectionSplit';
export { splitEntries } from './parserEntrySplit';
export { createWarning } from './parserWarnings';
