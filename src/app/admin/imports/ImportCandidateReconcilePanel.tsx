'use client';

import React, { useCallback, useMemo, useState } from 'react';

import type { ImportCandidateReconcileReviewModel } from './importDetailTypes';

type ApprovalAction = 'preserve-existing' | 'approve-removal' | 'skip';

type LocalApproval = {
  decisionId: string;
  approvedAction: ApprovalAction;
  selectedExistingId?: string;
};

type Props = {
  importId: string;
  reconcile: ImportCandidateReconcileReviewModel | null | undefined;
  onSaved: () => void;
};

function sectionLabel(section: string): string {
  switch (section) {
    case 'publications':
      return 'Publications';
    case 'awards':
      return 'Awards';
    case 'patents':
      return 'Patents (advisory)';
    case 'research':
      return 'Research (advisory)';
    default:
      return section;
  }
}

function isResolvableDecision(decision: ImportCandidateReconcileReviewModel['decisions'][number]): boolean {
  return decision.action === 'manual-review' || decision.action === 'remove-artifact';
}

function isAdvisorySection(section: string): boolean {
  return section === 'patents' || section === 'research';
}

function decisionControls(
  decision: ImportCandidateReconcileReviewModel['decisions'][number],
  clusterMembers: string[],
  clusterSelections: Record<string, string>,
  setClusterSelections: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setApproval: (approval: LocalApproval) => void,
): React.ReactNode {
  const isCluster = clusterMembers.length > 1;
  const isArtifact = decision.action === 'remove-artifact' && !isCluster;

  if (isCluster) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="input text-xs"
          value={clusterSelections[decision.decisionId] ?? clusterMembers[0] ?? ''}
          onChange={(e) =>
            setClusterSelections((s) => ({ ...s, [decision.decisionId]: e.target.value }))
          }
        >
          {clusterMembers.map((id) => (
            <option key={id} value={id}>
              Preserve {id}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() =>
            setApproval({
              decisionId: decision.decisionId,
              approvedAction: 'preserve-existing',
              selectedExistingId: clusterSelections[decision.decisionId] ?? clusterMembers[0],
            })
          }
        >
          Preserve selected
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() =>
            setApproval({ decisionId: decision.decisionId, approvedAction: 'approve-removal' })
          }
        >
          Remove entire cluster
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setApproval({ decisionId: decision.decisionId, approvedAction: 'skip' })}
        >
          Skip
        </button>
      </div>
    );
  }

  if (isArtifact) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() =>
            setApproval({ decisionId: decision.decisionId, approvedAction: 'approve-removal' })
          }
        >
          Approve removal
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setApproval({ decisionId: decision.decisionId, approvedAction: 'skip' })}
        >
          Skip
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() =>
          setApproval({ decisionId: decision.decisionId, approvedAction: 'preserve-existing' })
        }
      >
        Preserve existing
      </button>
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() =>
          setApproval({ decisionId: decision.decisionId, approvedAction: 'approve-removal' })
        }
      >
        Approve removal
      </button>
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={() => setApproval({ decisionId: decision.decisionId, approvedAction: 'skip' })}
      >
        Skip
      </button>
    </div>
  );
}

function approvalBadgeStatus(
  draftApproval: LocalApproval | undefined,
  serverApproval: LocalApproval | undefined,
): 'pending' | 'unsaved' | 'saved' {
  if (draftApproval) {
    return 'unsaved';
  }
  if (serverApproval) {
    return 'saved';
  }
  return 'pending';
}

function ApprovalStatusBadge({ status }: { status: 'pending' | 'unsaved' | 'saved' }) {
  if (status === 'saved') {
    return <span className="rounded bg-success/15 px-1.5 py-0.5 text-success">saved</span>;
  }
  if (status === 'unsaved') {
    return <span className="rounded bg-warning/15 px-1.5 py-0.5 text-warning">unsaved</span>;
  }
  return <span className="rounded bg-warning/15 px-1.5 py-0.5 text-warning">pending</span>;
}

export function ImportCandidateReconcilePanel({ importId, reconcile, onSaved }: Props) {
  const [draftApprovals, setDraftApprovals] = useState<LocalApproval[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [clusterSelections, setClusterSelections] = useState<Record<string, string>>({});

  const serverApprovals = useMemo(() => reconcile?.approvals ?? [], [reconcile?.approvals]);

  const effectiveApprovals = useMemo(() => {
    const map = new Map<string, LocalApproval>();
    for (const a of serverApprovals) {
      map.set(a.decisionId, a as LocalApproval);
    }
    for (const a of draftApprovals) {
      map.set(a.decisionId, a);
    }
    return map;
  }, [serverApprovals, draftApprovals]);

  const setApproval = useCallback((approval: LocalApproval) => {
    setDraftApprovals((prev) => {
      const next = prev.filter((a) => a.decisionId !== approval.decisionId);
      next.push(approval);
      return next;
    });
    setSavedMsg(null);
  }, []);

  const pendingDecisions = useMemo(() => {
    if (!reconcile?.hasManifest) {
      return [];
    }
    return reconcile.decisions.filter((d) => isResolvableDecision(d) && !isAdvisorySection(d.section));
  }, [reconcile]);

  const grouped = useMemo(() => {
    const sections = new Map<string, typeof pendingDecisions>();
    for (const d of pendingDecisions) {
      const list = sections.get(d.section) ?? [];
      list.push(d);
      sections.set(d.section, list);
    }
    return sections;
  }, [pendingDecisions]);

  const saveAll = useCallback(async () => {
    if (!reconcile?.manifestRevision) {
      return;
    }
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    const approvals = Array.from(effectiveApprovals.values());
    try {
      const res = await fetch(`/api/admin/imports/${importId}/review-approvals`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifestRevision: reconcile.manifestRevision,
          approvals,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message || json.error || 'Failed to save approvals');
        return;
      }
      setDraftApprovals([]);
      setSavedMsg('Reconciliation approvals saved.');
      onSaved();
    } catch {
      setError('Failed to save approvals');
    } finally {
      setSaving(false);
    }
  }, [effectiveApprovals, importId, onSaved, reconcile?.manifestRevision]);

  if (!reconcile) {
    return (
      <div className="card p-4 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Candidate reconciliation review</h2>
        <p className="text-sm text-muted">No reconciliation manifest is available for this import yet.</p>
      </div>
    );
  }

  if (!reconcile.hasManifest) {
    return (
      <div className="card p-4 space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Candidate reconciliation review</h2>
        <p className="text-sm text-muted">
          Manifest not generated. Re-process the import or merge to lazily generate reconciliation data.
        </p>
      </div>
    );
  }

  if (reconcile.loadError) {
    return (
      <div className="card p-4 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Candidate reconciliation review</h2>
        <div className="rounded border border-error/40 bg-error/10 px-3 py-2 text-sm text-foreground space-y-1">
          <p className="font-medium">Stored reconciliation data is invalid.</p>
          <p>Merge is blocked. Reprocess the import or repair the stored review data.</p>
          <p className="text-xs text-muted">{reconcile.loadError.message}</p>
        </div>
      </div>
    );
  }

  const pub = reconcile.accounting as {
    publications?: { candidateTotal?: number; baselineTotal?: number };
    awards?: { candidateTotal?: number; baselineTotal?: number };
  } | null;

  return (
    <div className="card p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Candidate reconciliation review</h2>
        <p className="text-xs text-muted">
          Approvals affect the proposed draft merge only — they do not publish content directly.
          Unresolved publication/award decisions block merge unless explicitly acknowledged with a reason.
        </p>
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded border border-primary/15 p-2">
          <p className="text-muted">Baseline</p>
          <p className="text-foreground">{reconcile.baseline?.label ?? reconcile.baseline?.sourceType}</p>
        </div>
        <div className="rounded border border-primary/15 p-2">
          <p className="text-muted">Unresolved blocking decisions</p>
          <p className={reconcile.mergeReviewBlocked ? 'text-warning font-medium' : 'text-foreground'}>
            {reconcile.unresolvedBlockingCount}
          </p>
        </div>
        <div className="rounded border border-primary/15 p-2">
          <p className="text-muted">Candidate publications / baseline</p>
          <p className="text-foreground">
            {pub?.publications?.candidateTotal ?? '—'} / {pub?.publications?.baselineTotal ?? '—'}
          </p>
        </div>
        <div className="rounded border border-primary/15 p-2">
          <p className="text-muted">Candidate awards / baseline</p>
          <p className="text-foreground">
            {pub?.awards?.candidateTotal ?? '—'} / {pub?.awards?.baselineTotal ?? '—'}
          </p>
        </div>
      </div>

      {reconcile.mergeReviewBlocked ? (
        <div className="rounded border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground">
          Merge is blocked until all publication and award reconciliation decisions are resolved or explicitly
          overridden at merge time.
        </div>
      ) : null}

      {error ? <div className="text-sm text-error">{error}</div> : null}
      {savedMsg ? <div className="text-sm text-success">{savedMsg}</div> : null}

      {[...grouped.entries()].map(([section, decisions]) => (
        <div key={section} className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">{sectionLabel(section)}</h3>
          <div className="space-y-3">
            {decisions.map((decision) => {
              const serverApproval = serverApprovals.find((a) => a.decisionId === decision.decisionId);
              const draftApproval = draftApprovals.find((a) => a.decisionId === decision.decisionId);
              const current = effectiveApprovals.get(decision.decisionId);
              const clusterMemberIds = [decision.existingId, ...(decision.relatedExistingIds ?? [])].filter(
                (id): id is string => Boolean(id),
              );
              const isCluster = clusterMemberIds.length >= 2;
              const clusterMembers = isCluster ? clusterMemberIds : [];
              const approvalStatus = approvalBadgeStatus(draftApproval, serverApproval as LocalApproval | undefined);

              return (
                <div key={decision.decisionId} className="rounded border border-primary/15 p-3 text-xs space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{decision.action}</span>
                    <span className="text-muted">confidence: {decision.confidence}</span>
                    <ApprovalStatusBadge status={approvalStatus} />
                  </div>
                  <p className="text-foreground">{decision.reason}</p>
                  {decision.existingId ? (
                    <p className="text-muted">Baseline id: {decision.existingId}</p>
                  ) : null}
                  {decision.candidateId ? (
                    <p className="text-muted">Candidate id: {decision.candidateId}</p>
                  ) : null}
                  {isCluster ? (
                    <p className="text-muted">Cluster members: {clusterMembers.join(', ')}</p>
                  ) : null}

                  {decisionControls(
                    decision,
                    clusterMembers,
                    clusterSelections,
                    setClusterSelections,
                    setApproval,
                  )}
                  {current ? (
                    <p className="text-muted">
                      Current approval: {current.approvedAction}
                      {current.selectedExistingId ? ` (${current.selectedExistingId})` : ''}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {reconcile.decisions.filter((d) => isAdvisorySection(d.section)).length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Advisory sections</h3>
          {reconcile.decisions
            .filter((d) => isAdvisorySection(d.section))
            .map((d) => (
              <div key={d.decisionId} className="rounded border border-primary/15 p-3 text-xs">
                <p className="font-medium text-foreground">{sectionLabel(d.section)}</p>
                <p className="text-foreground">{d.reason}</p>
                {d.affectedCount !== undefined && d.affectedCount !== null ? (
                  <p className="text-muted">Affected records: {d.affectedCount}</p>
                ) : null}
                <p className="text-muted">Informational only — no approval controls.</p>
              </div>
            ))}
        </div>
      ) : null}

      {pendingDecisions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-sm" disabled={saving} onClick={() => void saveAll()}>
            {saving ? 'Saving…' : 'Save reconciliation approvals'}
          </button>
          {reconcile.manifestRevision ? (
            <span className="text-xs text-muted self-center">
              manifest revision: {reconcile.manifestRevision.slice(0, 8)}…
            </span>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">No publication or award decisions require reconciliation approval.</p>
      )}
    </div>
  );
}
