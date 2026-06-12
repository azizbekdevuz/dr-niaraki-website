/**
 * Parser utility unit tests
 */

import { describe, it, expect } from 'vitest';

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

    it('should extract US publication application numbers', () => {
      expect(extractPatentNumber('US International Patent (US 2025/0166525 A1)')).toBe('2025/0166525 A1');
      expect(extractPatentNumber('US International Patent (US 2025/0166317 A1)')).toBe('2025/0166317 A1');
    });

    it('should extract US application serial numbers', () => {
      expect(extractPatentNumber('US International Patent (19/326,960)')).toBe('19/326,960');
      expect(extractPatentNumber('Patent Application No. 18/821,509 Pending Aug 2024')).toBe('18/821,509');
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
