export type ReviewBaselineQuery = 'auto' | 'working_draft' | 'canonical' | 'published';

export type ImportCandidateReviewModel = {
  schemaVersion: number;
  envelopeVersion: number;
  reviewHint: string;
  sourceTextHash: string;
  parserVersion: string;
  mappingVersion: string;
  rawSectionSummaries: Array<{
    sectionId: string;
    title: string;
    mappedWebsiteSection: string | null;
    confidence: string;
    itemCount: number;
    warningCount: number;
    textPreview?: string;
  }>;
  unmappedSections: Array<{ sectionId: string; title: string; reason: string }>;
  sectionMappingReport: Array<{
    docxSectionTitle: string;
    normalizedTitle: string;
    mappedWebsiteSection: string | null;
    confidence: string;
    parserUsed: string;
    itemCount: number;
    warningCount: number;
  }>;
  countValidation: {
    entries: Array<{
      domain: string;
      declaredInHeading: number | null;
      extractedCount: number;
      severity: string;
      code: string;
    }>;
  };
  parserWarnings: Array<{ code?: string; path?: string; message: string; severity: string }>;
};

export type ImportDetailModel = {
  id: string;
  status: string;
  originalFileName: string;
  parserVersion: string | null;
  warnings: { message: string; code?: string }[];
  candidateSummary: {
    profileName: string | null;
    publicationCount: number;
    patentCount: number;
    rawHtmlTruncated: boolean;
  } | null;
  /** Present for envelope `candidatePayload` (from GET import / review). */
  candidateReview?: ImportCandidateReviewModel | null;
};

export type ImportReviewProvenanceModel = {
  importId: string;
  originalFileName: string;
  storedPath: string;
  uploadedFileId: string;
};

export type ImportReviewBlockModel = {
  id: string;
  title: string;
  unchangedSummary: string | null;
  added: string[];
  removed: string[];
  changed: { label: string; lines: string[] }[];
};

export type ReviewPayloadModel = {
  baselineSource: string;
  /** Human-readable description of the baseline snapshot (canonical, working draft, or published). */
  baselineLabel: string;
  /** Which alternate baselines exist for this admin session (drives the baseline selector). */
  baselineCapabilities: {
    hasWorkingDraft: boolean;
    hasPublished: boolean;
  };
  blocks: ImportReviewBlockModel[];
  warnings: { message: string; code?: string }[];
  provenance: ImportReviewProvenanceModel | null;
  legacyUploadsMetaNote: string;
  mergeSafety: ImportMergeSafetyModel;
};

export type ImportMergeSectionRiskLabel =
  | 'safe_to_merge'
  | 'needs_review'
  | 'review_only_default'
  | 'requires_explicit_replace';

export type ImportMergeSectionSafetyModel = {
  id: string;
  title: string;
  risk: ImportMergeSectionRiskLabel;
  includeInSafeMerge: boolean;
  reasons: string[];
};

export type ImportMergeSafetyModel = {
  defaultMergeMode: 'safe_update';
  /** `full_replace` requires `acknowledgeHighRisk` when any section is not safe_to_merge. */
  fullReplaceRequiresAck: boolean;
  sections: ImportMergeSectionSafetyModel[];
  /** Cross-cutting notes (unmapped sections, envelope hints, parser severity, etc.). */
  notes: string[];
};

export type AiReviewSectionNoteModel = {
  sectionId: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  suggestedAction: 'review_manually' | 'safe_to_proceed' | 'do_not_full_replace' | 'check_counts';
};

export type AiReviewSuggestionModel = {
  advisory: true;
  enabled: boolean;
  provider: string;
  model?: string;
  status: 'ok' | 'disabled' | 'error' | 'timeout' | 'misconfigured';
  generatedAt: string;
  inputHash: string;
  summary?: string;
  sectionNotes?: AiReviewSectionNoteModel[];
  disclaimers: string[];
  error?: string;
};

export type AiProviderSettingsModel = {
  enabled: boolean;
  activeProvider: string;
  activeModel: string | null;
  source: 'database' | 'environment_fallback' | 'database_error';
  revision: number | null;
  settingsUnavailable?: boolean;
  savedEnabled: boolean;
  savedProvider: string;
  savedModel: string | null;
  switchingMode: 'runtime_database' | 'env_only';
  switchingNote: string;
  providers: Array<{
    id: string;
    label: string;
    status: string;
    active: boolean;
    selectable: boolean;
    model: string | null;
    allowedModels: string[];
    statusMessage: string;
    hostedNote?: string;
  }>;
  disclaimers: string[];
};
