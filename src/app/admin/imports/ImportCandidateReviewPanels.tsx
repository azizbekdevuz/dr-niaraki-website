'use client';

import React from 'react';

import type { ImportCandidateReviewModel, ImportDetailModel, ImportReviewBlockModel, ReviewPayloadModel } from './importDetailTypes';

function severityBorder(sev: string): string {
  if (sev === 'error') {
    return 'border-error/45 bg-error/[0.06]';
  }
  if (sev === 'warning') {
    return 'border-warning/45 bg-warning/[0.06]';
  }
  return 'border-primary/15 bg-surface-secondary/60';
}

function reviewHintTone(hint: string): { border: string; label: string } {
  if (hint === 'RAW_CHANGED_ONLY') {
    return {
      border: 'border-warning/50 bg-warning/10',
      label:
        'Raw document changed without safe structured merge deltas — inspect raw section summaries and structured review.',
    };
  }
  if (hint === 'NEEDS_REVIEW') {
    return {
      border: 'border-warning/50 bg-warning/10',
      label: 'Parser or validation flagged this import for manual review before relying on merge output.',
    };
  }
  return { border: 'border-success/30 bg-success/[0.04]', label: 'No mandatory review flags from envelope metadata.' };
}

function EnvelopeReviewCard({ cr }: { cr: ImportCandidateReviewModel }) {
  const tone = reviewHintTone(cr.reviewHint);
  return (
    <div className={`card p-4 border ${tone.border}`}>
      <p className="text-sm font-medium text-foreground">Envelope review</p>
      <p className="mt-1 text-xs text-muted">{tone.label}</p>
      <dl className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
        <div>
          <dt className="inline text-muted">reviewHint</dt>
          <dd className="inline font-mono text-foreground"> · {cr.reviewHint}</dd>
        </div>
        <div>
          <dt className="inline text-muted">schemaVersion</dt>
          <dd className="inline text-foreground"> · {cr.schemaVersion}</dd>
        </div>
        <div>
          <dt className="inline text-muted">envelopeVersion</dt>
          <dd className="inline text-foreground"> · {cr.envelopeVersion}</dd>
        </div>
        <div className="sm:col-span-2 break-all">
          <dt className="inline text-muted">sourceTextHash</dt>
          <dd className="inline font-mono text-foreground"> · {cr.sourceTextHash}</dd>
        </div>
        <div>
          <dt className="inline text-muted">parserVersion</dt>
          <dd className="inline text-foreground"> · {cr.parserVersion}</dd>
        </div>
        <div>
          <dt className="inline text-muted">mappingVersion</dt>
          <dd className="inline text-foreground"> · {cr.mappingVersion}</dd>
        </div>
      </dl>
    </div>
  );
}

function RawDriftStructuredPanel({ block }: { block: ImportReviewBlockModel }) {
  return (
    <div className="card border-warning/45 bg-warning/[0.07] p-4 text-sm text-foreground">
      <p className="font-medium">Raw document drift (structured review)</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
        {block.changed.flatMap((c) =>
          c.lines.map((ln, i) => (
            <li key={`${c.label}-${i}`} className="text-foreground/90">
              {ln}
            </li>
          )),
        )}
      </ul>
    </div>
  );
}

function CountValidationPanel({ cr }: { cr: ImportCandidateReviewModel }) {
  if (cr.countValidation.entries.length === 0) {
    return null;
  }
  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-foreground">Count validation</p>
      <ul className="mt-2 space-y-2">
        {cr.countValidation.entries.map((e, i) => (
          <li
            key={`${e.code}-${i}`}
            className={`rounded-md border px-3 py-2 text-xs ${severityBorder(e.severity)}`}
          >
            <span className="font-mono text-foreground">{e.code}</span>
            <span className="text-muted"> · {e.domain}</span>
            {e.declaredInHeading !== null ? (
              <span className="text-muted">
                {' '}
                — declared {e.declaredInHeading}, extracted {e.extractedCount}
              </span>
            ) : (
              <span className="text-muted"> — extracted {e.extractedCount}</span>
            )}
            {e.code === 'PATENT_COUNT_MISMATCH' ? (
              <span className="ml-1 font-medium text-warning"> (check patent list vs CV heading)</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UnmappedSectionsPanel({ cr }: { cr: ImportCandidateReviewModel }) {
  if (cr.unmappedSections.length === 0) {
    return null;
  }
  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-foreground">Unmapped sections</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
        {cr.unmappedSections.map((u) => (
          <li key={u.sectionId}>
            <span className="font-medium text-foreground">{u.title}</span>
            <span className="text-muted"> — {u.reason}</span>
            <span className="ml-1 font-mono text-[10px] text-muted">({u.sectionId})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ParserWarningsPanels({ cr }: { cr: ImportCandidateReviewModel }) {
  const parserImportant = cr.parserWarnings.filter((w) => w.severity !== 'info');
  const parserInfo = cr.parserWarnings.filter((w) => w.severity === 'info');
  return (
    <>
      {parserImportant.length > 0 ? (
        <div className="card border-warning/35 bg-warning/5 p-4">
          <p className="text-sm font-medium text-foreground">Parser warnings (warning / error)</p>
          <ul className="mt-2 space-y-2 text-xs">
            {parserImportant.map((w, i) => (
              <li key={`${w.code ?? 'n'}-${i}`} className="rounded border border-warning/25 bg-surface-secondary/50 px-2 py-1.5">
                <span className="font-mono text-warning">{w.severity}</span>
                {w.code ? <span className="ml-2 font-mono text-foreground">{w.code}</span> : null}
                {w.path ? <span className="ml-2 text-muted">{w.path}</span> : null}
                <p className="mt-1 text-foreground/90">{w.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {parserInfo.length > 0 ? (
        <details className="card p-3 text-xs text-muted">
          <summary className="cursor-pointer font-medium text-foreground">Other parser messages ({parserInfo.length})</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {parserInfo.map((w, i) => (
              <li key={`info-${i}`}>
                {w.code ? <span className="font-mono">{w.code}: </span> : null}
                {w.message}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  );
}

function RawSectionSummariesTable({ cr }: { cr: ImportCandidateReviewModel }) {
  if (cr.rawSectionSummaries.length === 0) {
    return null;
  }
  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-foreground">Section summaries (compact)</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-primary/15 text-muted">
              <th className="py-1.5 pr-2 font-medium">Title</th>
              <th className="py-1.5 pr-2 font-medium">Mapped</th>
              <th className="py-1.5 pr-2 font-medium">Conf.</th>
              <th className="py-1.5 pr-2 font-medium">Items</th>
              <th className="py-1.5 pr-2 font-medium">Warns</th>
              <th className="py-1.5 font-medium">Preview</th>
            </tr>
          </thead>
          <tbody>
            {cr.rawSectionSummaries.map((row) => (
              <tr key={row.sectionId} className="border-b border-primary/10 align-top">
                <td className="py-1.5 pr-2 text-foreground">{row.title}</td>
                <td className="max-w-[10rem] truncate py-1.5 pr-2 font-mono text-muted">
                  {row.mappedWebsiteSection ?? '—'}
                </td>
                <td className="py-1.5 pr-2 font-mono text-muted">{row.confidence}</td>
                <td className="py-1.5 pr-2 text-muted">{row.itemCount}</td>
                <td className="py-1.5 pr-2 text-muted">{row.warningCount}</td>
                <td className="max-w-[14rem] truncate py-1.5 text-muted" title={row.textPreview}>
                  {row.textPreview ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionMappingReportTable({ cr }: { cr: ImportCandidateReviewModel }) {
  if (cr.sectionMappingReport.length === 0) {
    return null;
  }
  return (
    <div className="card p-4">
      <p className="text-sm font-medium text-foreground">Section mapping report</p>
      <div className="mt-2 max-h-64 overflow-y-auto overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 border-b border-primary/15 bg-surface-secondary text-muted">
              <th className="py-1.5 pr-2 font-medium">Title</th>
              <th className="py-1.5 pr-2 font-medium">Parser</th>
              <th className="py-1.5 pr-2 font-medium">Mapped</th>
              <th className="py-1.5 pr-2 font-medium">Conf.</th>
              <th className="py-1.5 pr-2 font-medium">Items</th>
              <th className="py-1.5 font-medium">Warns</th>
            </tr>
          </thead>
          <tbody>
            {cr.sectionMappingReport.map((row, i) => (
              <tr key={`${row.normalizedTitle}-${i}`} className="border-b border-primary/10">
                <td className="py-1 pr-2 text-foreground">{row.docxSectionTitle}</td>
                <td className="py-1 pr-2 font-mono text-muted">{row.parserUsed}</td>
                <td className="max-w-[10rem] truncate py-1 pr-2 font-mono text-muted">
                  {row.mappedWebsiteSection ?? '—'}
                </td>
                <td className="py-1 pr-2 font-mono text-muted">{row.confidence}</td>
                <td className="py-1 pr-2 text-muted">{row.itemCount}</td>
                <td className="py-1 text-muted">{row.warningCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Props = {
  imp: ImportDetailModel;
  review: ReviewPayloadModel | null;
};

export function ImportCandidateReviewPanels({ imp, review }: Props) {
  const cr = imp.candidateReview;
  const rawDriftBlock = review?.blocks?.find((b) => b.id === 'raw_document_change');

  if (!cr && !rawDriftBlock) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="import-candidate-review-panels">
      {cr ? <EnvelopeReviewCard cr={cr} /> : null}
      {rawDriftBlock ? <RawDriftStructuredPanel block={rawDriftBlock} /> : null}
      {cr ? (
        <>
          <CountValidationPanel cr={cr} />
          <UnmappedSectionsPanel cr={cr} />
          <ParserWarningsPanels cr={cr} />
          <RawSectionSummariesTable cr={cr} />
          <SectionMappingReportTable cr={cr} />
        </>
      ) : null}
    </div>
  );
}
