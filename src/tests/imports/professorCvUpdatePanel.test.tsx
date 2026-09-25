/** @vitest-environment happy-dom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfessorCvUpdatePanel } from '@/app/admin/imports/ProfessorCvUpdatePanel';
import type { ProfessorChangeSet } from '@/app/admin/imports/professorCvUpdateTypes';

const summaryChangeSet: ProfessorChangeSet = {
  summary: {
    totalChanges: 3,
    safelyPrepared: 1,
    requiresReview: 2,
    unchangedItemCount: 189,
    noWebsiteRelevantChanges: false,
  },
  sectionSummaries: [
    {
      sectionKey: 'publications',
      label: 'Publications',
      changes: 2,
      unchanged: 189,
      requiresReview: 1,
      safelyPrepared: 1,
    },
    {
      sectionKey: 'profile',
      label: 'Profile',
      changes: 1,
      unchanged: 0,
      requiresReview: 1,
      safelyPrepared: 0,
    },
  ],
  items: [
    {
      id: 'change:publications:1',
      sectionKey: 'publications',
      fieldPath: 'publications.1',
      kind: 'added',
      safelyPrepared: true,
      requiresReview: false,
      label: 'New publication',
      summary: 'Added from CV',
      candidateValue: {
        title: 'Paper A',
        authors: 'A. Author',
        journal: 'Journal of Tests',
        year: 2024,
        doi: null,
      },
      websiteValue: null,
      warnings: [],
    },
    {
      id: 'change:publications:2',
      sectionKey: 'publications',
      fieldPath: 'publications.2',
      kind: 'modified',
      safelyPrepared: false,
      requiresReview: true,
      label: 'Updated publication',
      summary: 'Title changed',
      previousCvValue: 'Old title',
      candidateValue: 'New title',
      websiteValue: 'Old title',
      warnings: [],
    },
    {
      id: 'change:profile:name',
      sectionKey: 'profile',
      fieldPath: 'profile.name',
      kind: 'modified',
      safelyPrepared: false,
      requiresReview: true,
      label: 'Display name',
      summary: 'Name differs from website',
      candidateValue: 'Dr. New',
      websiteValue: 'Dr. Old',
      warnings: [],
    },
  ],
  unknownSections: [],
  changeSetRevision: 'a'.repeat(32),
};

const noChangeSet: ProfessorChangeSet = {
  summary: {
    totalChanges: 0,
    safelyPrepared: 0,
    requiresReview: 0,
    unchangedItemCount: 50,
    noWebsiteRelevantChanges: true,
  },
  sectionSummaries: [
    {
      sectionKey: 'publications',
      label: 'Publications',
      changes: 0,
      unchanged: 50,
      requiresReview: 0,
      safelyPrepared: 0,
    },
  ],
  items: [],
  unknownSections: [],
  changeSetRevision: 'b'.repeat(32),
};

describe('ProfessorCvUpdatePanel', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders Needs your review and Ready to apply sections', async () => {
    // Allow structured-edit + bulk-save round-trip without flaking on default 5s timeout.
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, changeSet: summaryChangeSet, decisions: [] }),
    });

    render(
      <ProfessorCvUpdatePanel
        importId="imp-1"
        hasDraft={false}
        merging={false}
        onApplyToDraft={vi.fn()}
      />,
    );

    expect(screen.getByText(/checking what changed/i)).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Review CV updates/i })).toBeTruthy();
    });

    const panel = screen.getByRole('heading', { name: /Review CV updates/i }).closest('section');
    expect(panel?.textContent).toMatch(/Needs your review/i);
    expect(panel?.textContent).toMatch(/Ready to apply/i);
    expect(panel?.textContent).toMatch(/3\s*changes/i);
    expect(panel?.textContent).toMatch(/189\s*unchanged items/i);
    expect(panel?.textContent).toMatch(/Sections with changes: Publications, Profile/);
    expect(screen.getByRole('button', { name: /Apply approved changes to draft/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Preview draft/i })).toBeTruthy();

    // Ready-to-apply starts collapsed when count > 3 — here only 1 ready item, so open.
    expect(screen.getByText(/Title: Paper A/)).toBeTruthy();

    const paperCard = screen.getByText(/Title: Paper A/).closest('article');
    expect(paperCard).toBeTruthy();
    fireEvent.click(
      Array.from(paperCard!.querySelectorAll('button')).find((b) => /^Edit$/i.test(b.textContent ?? ''))!,
    );
    const titleInput = screen.getByDisplayValue('Paper A');
    expect(titleInput.className).toMatch(/form-input|bg-surface-secondary/);
    expect(titleInput.className).toMatch(/text-foreground/);
    fireEvent.change(titleInput, { target: { value: 'Paper A (edited)' } });
    fireEvent.click(screen.getByRole('button', { name: /Save edit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Choice:\s*Edit/i)).toBeTruthy();
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    });
    fireEvent.click(screen.getByRole('button', { name: /^Save choices$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Choices saved/i)).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/imports/imp-1/change-decisions',
      expect.objectContaining({ method: 'POST' }),
    );
    const saveCall = fetchMock.mock.calls.find((c) => String(c[0]).includes('change-decisions'));
    const saveBody = JSON.parse((saveCall?.[1] as { body: string }).body);
    expect(
      saveBody.decisions.some(
        (d: { action: string; editedValue?: { title?: string } }) =>
          d.action === 'edit' && d.editedValue?.title === 'Paper A (edited)',
      ),
    ).toBe(true);
  }, 15_000);
  it('renders no-change message when nothing website-relevant changed', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, changeSet: noChangeSet, decisions: null }),
    });

    render(
      <ProfessorCvUpdatePanel
        importId="imp-2"
        hasDraft={true}
        merging={false}
        onApplyToDraft={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/No website-relevant changes detected/i)).toBeTruthy();
    });
    expect(screen.queryByText(/Needs your review/i)).toBeNull();
    expect(screen.queryByText(/Ready to apply/i)).toBeNull();
  });
});