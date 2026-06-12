/** @vitest-environment happy-dom */

import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { DraftEditorSitePreview } from '@/app/admin/content/DraftEditorSitePreview';
import type {
  ImportDetailModel,
  ImportMergeSafetyModel,
  ReviewPayloadModel,
} from '@/app/admin/imports/importDetailTypes';
import { ImportMergeDraftCard } from '@/app/admin/imports/ImportMergeDraftCard';
import { ImportReviewBlockDiffLists } from '@/app/admin/imports/ImportReviewBlockDiffLists';
import { ReviewableStringList } from '@/components/shared/ReviewableStringList';
import { SITE_CONTENT_RAW } from '@/content/defaults';
import { assertSiteContent } from '@/content/validators';
import { extractEditorSliceFromSiteContent } from '@/lib/draftEditorSlice';
import { PARSER_VERSION } from '@/parser/parserVersion';

const baseSafety: ImportMergeSafetyModel = {
  defaultMergeMode: 'safe_update',
  fullReplaceRequiresAck: true,
  sections: [],
  notes: [],
};

const baseReview: ReviewPayloadModel = {
  baselineSource: 'canonical',
  baselineLabel: 'Canonical',
  baselineCapabilities: { hasWorkingDraft: false, hasPublished: true },
  blocks: [],
  warnings: [],
  provenance: null,
  legacyUploadsMetaNote: '',
  mergeSafety: baseSafety,
};

function makeImp(overrides?: Partial<ImportDetailModel>): ImportDetailModel {
  return {
    id: 'imp1',
    status: 'REVIEWED',
    originalFileName: 'cv.docx',
    parserVersion: null,
    warnings: [],
    candidateSummary: null,
    candidateReview: null,
    ...overrides,
  };
}

describe('admin review / editor interaction', () => {
  it('ReviewableStringList expands to reveal all warning lines', () => {
    const items = Array.from({ length: 5 }, (_, i) => `Warning line ${i + 1}`);
    render(<ReviewableStringList title="Parse warnings" items={items} />);
    const root = screen.getByTestId('reviewable-string-list');
    expect(root.hasAttribute('open')).toBe(false);
    fireEvent.click(screen.getByText(/Parse warnings/i));
    expect(root.hasAttribute('open')).toBe(true);
    expect(within(root).getByText('Warning line 5')).toBeTruthy();
  });

  it('ImportReviewBlockDiffLists keeps added lines inside scrollable disclosure', () => {
    const lines = Array.from({ length: 30 }, (_, i) => `row-${i + 1}`);
    render(
      <ImportReviewBlockDiffLists
        block={{
          id: 'blk',
          title: 'Test block',
          unchangedSummary: null,
          added: lines,
          removed: [],
          changed: [],
        }}
      />,
    );
    const added = screen.getByTestId('import-diff-added');
    expect(added.hasAttribute('open')).toBe(false);
    fireEvent.click(within(added).getByText(/^Added/));
    expect(added.hasAttribute('open')).toBe(true);
    expect(within(added).getByText('row-30')).toBeTruthy();
  });

  it('DraftEditorSitePreview shows edited display name on Home tab', () => {
    const base = assertSiteContent(SITE_CONTENT_RAW);
    const slice = extractEditorSliceFromSiteContent(base);
    slice.profile.displayName = 'Editorial Preview Name';
    render(<DraftEditorSitePreview slice={slice} siteContext={base} />);
    fireEvent.click(screen.getByTestId('draft-preview-tab-home'));
    const panel = screen.getByTestId('draft-preview-home');
    expect(within(panel).getByText('Editorial Preview Name')).toBeTruthy();
  });

  it('ImportMergeDraftCard shows stale parser banner when candidate version differs', () => {
    const imp = makeImp({
      candidateReview: {
        schemaVersion: 1,
        envelopeVersion: 1,
        reviewHint: 'OK',
        sourceTextHash: 'abc',
        parserVersion: 'v0.9.0',
        mappingVersion: '1',
        rawSectionSummaries: [],
        unmappedSections: [],
        sectionMappingReport: [],
        countValidation: { entries: [] },
        parserWarnings: [],
      },
    });
    render(<ImportMergeDraftCard imp={imp} review={baseReview} hasDraft={false} merging={false} onMerge={() => {}} />);
    expect(screen.getByText(/Older parser version/i)).toBeTruthy();
    expect(screen.getByText('v0.9.0')).toBeTruthy();
    expect(screen.getByText(PARSER_VERSION)).toBeTruthy();
  });

  it('ImportMergeDraftCard shows full_replace acknowledgement listing curated sections', () => {
    const imp = makeImp();
    render(<ImportMergeDraftCard imp={imp} review={baseReview} hasDraft={false} merging={false} onMerge={() => {}} />);
    fireEvent.click(screen.getByRole('radio', { name: /Full replace/i }));
    expect(screen.getByText(/academic journey/i)).toBeTruthy();
    expect(screen.getByText(/publications, and patents/i)).toBeTruthy();
  });
});
