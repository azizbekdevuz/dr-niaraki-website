/**
 * Research grants / projects parsing and student-count heuristics (DOCX pipeline).
 */

import type { Grant, ResearchProject } from '@/types/details';

import { generateStableId } from './parserUtils';
import { extractMonthYearPeriod, extractPeriodFromText, resolveResearchProjectStatus } from './periodExtract';

export function parseGrantsSection(text: string): Grant[] {
  const grantsResult: Grant[] = [];
  const entries = text.split(/(?=Project title:|Funding:)/i).filter((e) => e.trim().length > 50);

  entries.forEach((entry, index) => {
    const titleMatch = entry.match(/Project title:\s*([^\n]+)/i);
    const fundingMatch = entry.match(/Funding:\s*([^\n]+)/i);
    const periodMatch = entry.match(/Duration:\s*([^\n]+)/i) || entry.match(/(\d{4}\s*[-–]\s*\d{4})/);
    const roleMatch = entry.match(/Role:\s*([^\n]+)/i);
    const agencyMatch = entry.match(/Funding Agency:\s*([^\n]+)/i);

    if (titleMatch && titleMatch[1]) {
      grantsResult.push({
        id: generateStableId(titleMatch[1], index),
        title: titleMatch[1].trim(),
        fundingAgency: agencyMatch?.[1]?.trim() ?? null,
        amount: fundingMatch?.[1]?.trim() ?? null,
        period: periodMatch?.[1]?.trim() ?? null,
        role: roleMatch?.[1]?.trim() ?? null,
        raw: entry.trim(),
      });
    }
  });

  return grantsResult;
}

function extractFundingAmount(text: string): string | null {
  const dollar = text.match(/(?:approx\.?\s*)?(?:\$|USD)\s*([\d,]+(?:\.\d+)?)\s*([MKmk])?/i);
  if (dollar?.[1]) {
    return `$${dollar[1]}${dollar[2] ?? ''}`;
  }

  const contextual = text.match(
    /(?:funding|budget|grant|approx\.?|total|R&D|multi-million-dollar)[^.!\n]{0,100}?([\d,]+(?:\.\d+)?)\s*([MKmk])\b/i,
  );
  if (contextual?.[1]) {
    return `$${contextual[1]}${contextual[2] ?? ''}`;
  }

  return null;
}

export { extractFundingAmount };

export function parseResearchSection(text: string): ResearchProject[] {
  const projectsResult: ResearchProject[] = [];
  const entries = text.split(/\n(?=[A-Z][^\n]*\s*\|)/);

  entries.forEach((entry, index) => {
    const trimmed = entry.trim();
    if (trimmed.length < 30) {
      return;
    }

    const lines = trimmed.split('\n');
    const header = lines[0] ?? '';
    if (!header.includes('|')) {
      return;
    }
    const pipeParts = header.split('|');
    const title = pipeParts[0]?.trim() || '';
    if (/^(?:Academic Program Development|International Partnerships|Research Grants,?)/i.test(title)) {
      return;
    }
    const fundingAgency = pipeParts.length > 1 ? pipeParts.slice(1).join('|').trim() : null;

    const monthPeriod = extractMonthYearPeriod(trimmed);
    const barePeriod = extractPeriodFromText(trimmed);
    const period = monthPeriod ?? barePeriod?.period ?? null;

    const fundingAmount = extractFundingAmount(trimmed);
    const status = resolveResearchProjectStatus(trimmed, period);

    if (title) {
      projectsResult.push({
        id: generateStableId(title, index),
        title,
        description: lines.slice(1).join('\n').trim() || null,
        period,
        funding: fundingAgency,
        fundingAmount,
        role: null,
        status,
        raw: trimmed,
      });
    }
  });

  return projectsResult;
}

export function countStudents(text: string): number {
  const match = text.match(/(?:supervised?|mentored?)\s*(?:more than\s+)?(\d+)\+?\s*((?:Master|PhD|graduate))/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  const studentSection = text.match(/(?:Master|PhD)\s*Students?[\s\S]*?(?=\n[A-Z]{2,}|\n{3}|Professional|$)/i);
  if (studentSection) {
    const names = studentSection[0].match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\s*[-–]/g);
    return names?.length || 0;
  }

  return 0;
}
