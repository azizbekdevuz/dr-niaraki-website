/**
 * Phase 4C – Real-DOCX diagnostic test.
 *
 * Parses docs/resume.docx and emits a structured report for Phase 4B
 * verification.  Skips automatically when the file is absent (CI safe).
 *
 * Run manually:
 *   npx vitest run src/tests/parser/parserDiagnostic4C.test.ts --reporter=verbose
 *
 * The file is gitignored; never commit it.
 */

/* eslint-disable no-console */
/* eslint-disable complexity */

import fs from 'fs';
import path from 'path';

import { describe, expect, it } from 'vitest';

import { parseDocxToDetails } from '@/parser/docxParser';
import { splitIntoSections } from '@/parser/parserUtils';

const RESUME = path.join(process.cwd(), 'docs', 'resume.docx');
const hasResume = fs.existsSync(RESUME);
const run = hasResume ? it : it.skip;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sectionSummary(title: string, type: string, content: string) {
  const words = content.trim().split(/\s+/).length;
  const lines = content.trim().split('\n').length;
  return `  [${type}] "${title}" — ${lines} lines, ${words} words`;
}

// ---------------------------------------------------------------------------
// Diagnostic report
// ---------------------------------------------------------------------------

describe('Phase 4C — real DOCX diagnostic', () => {
  run(
    'parser output report',
    async () => {
      const buf = fs.readFileSync(RESUME);
      const { data, warnings, artifacts } = await parseDocxToDetails(buf, 'resume.docx', 'diagnostic');

      // ---- raw section map ----
      console.log('\n=== SECTIONS DETECTED ===');
      for (const s of artifacts.sections) {
        console.log(sectionSummary(s.title, s.type, s.content));
      }

      // ---- focus: publication+patent area ----
      console.log('\n=== PUB / PATENT SECTION DETAIL ===');
      const interestingTypes = new Set(['publications', 'patents', 'unknown']);
      const interestingTitleRe = /publications?|patents?|books?|journal|conference|chapter|korean|international/i;
      for (const s of artifacts.sections) {
        if (interestingTypes.has(s.type) || interestingTitleRe.test(s.title)) {
          const preview = s.content.slice(0, 300).replace(/\n/g, '\\n');
          console.log(`  [${s.type}] "${s.title}"`);
          console.log(`    preview: ${preview}`);
        }
      }

      // ---- counts ----
      console.log('\n=== COUNTS ===');
      console.log(`  publications : ${data.publications.length}`);
      console.log(`  patents      : ${data.patents.length}`);
      console.log(`  projects     : ${data.research.projects.length}`);
      console.log(`  awards       : ${data.about.awards.length}`);
      console.log(`  education    : ${data.about.education.length}`);
      console.log(`  positions    : ${data.about.positions.length}`);

      // ---- declared patent count from heading ----
      const patentHeading = artifacts.sections.find((s) => s.type === 'patents');
      const declaredMatch = patentHeading?.title.match(/\((\d+)/);
      const declared = declaredMatch ? parseInt(declaredMatch[1] ?? '0', 10) : null;
      console.log(`  declared patents (from heading): ${declared ?? 'not found'}`);
      console.log(`  extracted patents              : ${data.patents.length}`);
      console.log(`  patent count gap               : ${declared !== null ? declared - data.patents.length : 'n/a'}`);

      // ---- patent detail ----
      console.log('\n=== PATENT SAMPLES (first 8) ===');
      for (const p of data.patents.slice(0, 8)) {
        console.log(`  #${data.patents.indexOf(p) + 1} country=${p.country ?? 'null'} type=${p.type ?? 'null'} number="${p.number ?? 'null'}" title="${p.title.slice(0, 60)}"`);
      }

      // ---- Korean patent country inference ----
      const krByCountry = data.patents.filter((p) => p.country === 'Korea');
      const usPatents = data.patents.filter((p) => p.country === 'US');
      const nullCountry = data.patents.filter((p) => p.country === null);
      console.log('\n=== PATENT COUNTRY BREAKDOWN ===');
      console.log(`  country=Korea : ${krByCountry.length}`);
      console.log(`  country=US    : ${usPatents.length}`);
      console.log(`  country=null  : ${nullCountry.length}`);

      // ---- publication type breakdown ----
      const pubByType: Record<string, number> = {};
      for (const pub of data.publications) {
        const t = pub.type ?? 'null';
        pubByType[t] = (pubByType[t] ?? 0) + 1;
      }
      console.log('\n=== PUBLICATION TYPE BREAKDOWN ===');
      for (const [t, n] of Object.entries(pubByType)) {
        console.log(`  ${t}: ${n}`);
      }

      // ---- publications with null year (potential stub entries) ----
      const nullYearPubs = data.publications.filter((p) => p.year === null);
      console.log(`\n=== NULL-YEAR PUBLICATIONS (potential stubs): ${nullYearPubs.length} ===`);
      for (const p of nullYearPubs.slice(0, 5)) {
        console.log(`  raw: "${p.raw?.slice(0, 100)}"`);
      }

      // ---- raw text around patent section ----
      const patentSection = artifacts.sections.find((s) => s.type === 'patents');
      if (patentSection) {
        const pc = patentSection.content;
        console.log(`\n=== PATENT SECTION (${pc.length} chars, ${pc.split('\n').length} lines) ===`);
        for (let start = 0; start < Math.min(pc.length, 5000); start += 600) {
          console.log(`\n--- chars ${start}-${start + 600} ---`);
          console.log(pc.slice(start, start + 600));
        }
        // Show each line so entry-split boundary is visible
        console.log('\n=== PATENT SECTION LINES (first 80) ===');
        pc.split('\n').slice(0, 80).forEach((l, i) => console.log(`  ${String(i + 1).padStart(3)}: ${l}`));
      }

      // ---- warnings ----
      console.log(`\n=== PARSER WARNINGS (${warnings.length} total) ===`);
      const grouped: Record<string, typeof warnings> = {};
      for (const w of warnings) {
        (grouped[w.field] ??= []).push(w);
      }
      for (const [field, ws] of Object.entries(grouped)) {
        console.log(`  [${field}] ${ws.length} warning(s):`);
        for (const w of ws.slice(0, 3)) {
          console.log(`    ${w.severity}: ${w.message.slice(0, 100)}`);
        }
        if (ws.length > 3) {
          console.log(`    ... +${ws.length - 3} more`);
        }
      }

      // ---- verify: no ALL-CAPS publication subsection banners became boundaries ----
      // Check case-sensitively: title-case "Books and Book Chapters" is still
      // intentionally a section boundary (known limitation D); this check only
      // catches ALL-CAPS forms that Phase 4B Fix A was meant to suppress.
      const badSections = artifacts.sections.filter((s) => {
        const t = s.title.trim();
        return (
          s.type === 'publications' &&
          t === t.toUpperCase() &&
          /^(BOOKS AND BOOK CHAPTERS|JOURNAL PAPERS|CONFERENCE PAPERS|BOOKS|BOOK CHAPTERS)/.test(t)
        );
      });
      console.log(`\n=== PHASE 4B FIX A CHECK ===`);
      console.log(
        badSections.length === 0
          ? '  PASS: no ALL-CAPS subsection promoted to top-level publications section'
          : `  FAIL: ${badSections.length} ALL-CAPS subsection(s) still a top-level boundary: ${badSections.map((s) => s.title).join(', ')}`,
      );

      // ---- verify: Korean country inference ----
      console.log(`\n=== PHASE 4B FIX B CHECK ===`);
      const krByNum = data.patents.filter((p) => /\b10-\d{4,}/.test(p.number ?? ''));
      const krWithCountry = krByNum.filter((p) => p.country === 'Korea');
      console.log(`  Patents with Korean number pattern: ${krByNum.length}`);
      console.log(`  Of those with country=Korea       : ${krWithCountry.length}`);
      console.log(
        krWithCountry.length === krByNum.length
          ? '  PASS: all Korean-numbered patents infer country=Korea'
          : `  PARTIAL: ${krWithCountry.length}/${krByNum.length} Korean-numbered patents have country=Korea`,
      );

      // ---- split check: raw text boundary test ----
      console.log('\n=== SECTION BOUNDARY SPOT-CHECK ===');
      const rawText = artifacts.rawDocumentText;
      const booksAllCapsIdx = rawText.indexOf('BOOKS AND BOOK CHAPTERS');
      const journalAllCapsIdx = rawText.indexOf('JOURNAL PAPERS');
      const confAllCapsIdx = rawText.indexOf('CONFERENCE PAPERS');
      console.log(`  "BOOKS AND BOOK CHAPTERS" in raw text: ${booksAllCapsIdx >= 0 ? `YES (index ${booksAllCapsIdx})` : 'NO'}`);
      console.log(`  "JOURNAL PAPERS" in raw text          : ${journalAllCapsIdx >= 0 ? 'YES' : 'NO'}`);
      console.log(`  "CONFERENCE PAPERS" in raw text       : ${confAllCapsIdx >= 0 ? 'YES' : 'NO'}`);

      // Verify splitIntoSections on the same raw text
      const allSections = splitIntoSections(rawText);
      const allCapsPublicationSections = allSections.filter(
        (s) =>
          s.type === 'publications' &&
          s.title === s.title.toUpperCase() &&
          /books|journal|conference/i.test(s.title),
      );
      console.log(
        `  ALL-CAPS pub section boundaries in raw text: ${allCapsPublicationSections.length}`,
      );
      if (allCapsPublicationSections.length > 0) {
        console.log('  BAD sections:', allCapsPublicationSections.map((s) => s.title));
      }

      // ---- basic sanity assertions ----
      expect(data.contact.email).toMatch(/@/);
      expect(data.about.education.length).toBeGreaterThanOrEqual(2);
      // Phase 4B fix A: no ALL-CAPS pub subsection should be a boundary
      expect(badSections).toHaveLength(0);
    },
    30_000,
  );
});
