export type ImportMergeSectionRiskLabel =
  | 'safe_to_merge'
  | 'needs_review'
  | 'review_only_default'
  | 'requires_explicit_replace';

export type ImportMergeSectionSafety = {
  /** Matches structured review block ids (e.g. `journey`, `patents`). */
  id: string;
  title: string;
  risk: ImportMergeSectionRiskLabel;
  /** When false, `safe_update` merge keeps the baseline slice for this section. */
  includeInSafeMerge: boolean;
  reasons: string[];
};

export type ImportMergeSafetyReport = {
  defaultMergeMode: 'safe_update';
  /** `full_replace` merge requires `acknowledgeHighRisk` when any section is not `safe_to_merge`. */
  fullReplaceRequiresAck: boolean;
  sections: ImportMergeSectionSafety[];
  /** Cross-cutting notes (unmapped sections, envelope hints, etc.). */
  notes: string[];
};

/**
 * Optional data-quality signals derived from imported Details vs SiteContent baseline.
 * Used to surface additional warnings for sections that may have parser-quality issues
 * even when churn-based thresholds alone don't flag them.
 */
export type ImportQualityHints = {
  /**
   * Journey count comparison + giant-row detector.
   * Populated from Details.about.education (imported) vs SiteContent.about.journey (baseline).
   */
  journeyCollapse?: {
    importedCount: number;
    baselineCount: number;
    /** True when any imported education entry has details/raw > 400 chars (suggests concatenated rows). */
    hasGiantRows: boolean;
  };
  /**
   * Experience row quality: positions with institution === 'Unknown Organization'.
   * Populated from Details.about.positions.
   */
  experienceQuality?: {
    unknownOrgCount: number;
    totalCount: number;
  };
};

export type CvDetailsMergeFreezeKey =
  | 'profile'
  | 'summary'
  | 'journey'
  | 'experiences'
  | 'awards'
  | 'contact'
  | 'publications'
  | 'patents'
  | 'researchInterests'
  | 'researchProjects'
  | 'cvNarrative';
