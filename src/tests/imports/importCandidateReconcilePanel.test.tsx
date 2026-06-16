/** @vitest-environment happy-dom */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImportCandidateReconcilePanel } from '@/app/admin/imports/ImportCandidateReconcilePanel';
import type { ImportCandidateReconcileReviewModel } from '@/app/admin/imports/importDetailTypes';

const reconcile: ImportCandidateReconcileReviewModel = {
  hasManifest: true,
  manifestRevision: 'abcd1234abcd1234abcd1234abcd1234',
  sourceTextHash: 'hash',
  baseline: { sourceType: 'canonical', label: 'Canonical baseline' },
  generatedAt: '2026-01-01T00:00:00.000Z',
  importSource: 'cv.docx',
  decisions: [
    {
      decisionId: 'publications:base-1::manual-review',
      section: 'publications',
      existingId: 'base-1',
      action: 'manual-review',
      reason: 'Baseline-only publication',
      confidence: 'medium',
    },
    {
      decisionId: 'awards:artifact-1::remove-artifact',
      section: 'awards',
      existingId: 'artifact-1',
      action: 'remove-artifact',
      reason: 'Professional Memberships row',
      confidence: 'high',
    },
    {
      decisionId: 'awards:cluster:dup-a+dup-b',
      section: 'awards',
      existingId: 'dup-a',
      relatedExistingIds: ['dup-b'],
      action: 'manual-review',
      reason: 'Duplicate cluster',
      confidence: 'medium',
    },
    {
      decisionId: 'patents:status-unknown',
      section: 'patents',
      action: 'manual-review',
      reason: 'Advisory patent status',
      confidence: 'high',
      affectedCount: 2,
    },
  ],
  accounting: {
    publications: { candidateTotal: 1, baselineTotal: 2, unresolvedManualReview: 1 },
    awards: { candidateTotal: 0, baselineTotal: 3, unresolvedManualReview: 2 },
  },
  analysisAccounting: null,
  approvals: [],
  approvalsUpdatedAt: null,
  unresolvedBlockingCount: 3,
  mergeReviewBlocked: true,
  advisoryOnly: false,
};

describe('ImportCandidateReconcilePanel', () => {
  it('renders advisory section without approval controls', () => {
    render(<ImportCandidateReconcilePanel importId="imp-1" reconcile={reconcile} onSaved={vi.fn()} />);
    expect(screen.getByText(/Advisory sections/i)).toBeTruthy();
    expect(screen.getByText(/Informational only/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Preserve existing/i })).toBeTruthy();
  });

  it('does not offer preserve-existing for remove-artifact decisions', () => {
    render(<ImportCandidateReconcilePanel importId="imp-1" reconcile={reconcile} onSaved={vi.fn()} />);
    const artifactCard = screen.getByText(/Professional Memberships row/i).closest('div');
    expect(artifactCard?.textContent).toContain('Approve removal');
    expect(artifactCard?.textContent).not.toContain('Preserve existing');
  });

  it('shows cluster preserve controls', () => {
    render(<ImportCandidateReconcilePanel importId="imp-1" reconcile={reconcile} onSaved={vi.fn()} />);
    expect(screen.getByText(/Cluster members: dup-a, dup-b/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Preserve selected/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Remove entire cluster/i })).toBeTruthy();
  });

  it('submits approvals to API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const onSaved = vi.fn();
    render(<ImportCandidateReconcilePanel importId="imp-1" reconcile={reconcile} onSaved={onSaved} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Approve removal/i })[0]!);
    fireEvent.click(screen.getByRole('button', { name: /Save reconciliation approvals/i }));
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/imports/imp-1/review-approvals',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    vi.unstubAllGlobals();
  });
});
