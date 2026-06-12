import 'server-only';

export type AiProviderId = 'none' | 'ollama' | 'openrouter' | 'groq' | 'openai';

export type AiReviewStatus = 'ok' | 'disabled' | 'error' | 'timeout' | 'misconfigured';

export type AiReviewSuggestedAction =
  | 'review_manually'
  | 'safe_to_proceed'
  | 'do_not_full_replace'
  | 'check_counts';

export type AiReviewSectionNote = {
  sectionId: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  suggestedAction: AiReviewSuggestedAction;
};

export type AiReviewInput = {
  importId: string;
  importStatus: string;
  parserVersion: string | null;
  mappingVersion: string | null;
  baselineSource: string;
  baselineLabel: string;
  reviewHint: string | null;
  countValidation: Array<{
    code: string;
    domain: string;
    severity: string;
    declaredInHeading: number | null;
    extractedCount: number;
  }>;
  parserWarnings: Array<{ code?: string; message: string; severity: string }>;
  unmappedSections: Array<{ sectionId: string; title: string; reason: string }>;
  mergeSafety: {
    fullReplaceRequiresAck: boolean;
    sections: Array<{
      id: string;
      title: string;
      risk: string;
      includeInSafeMerge: boolean;
      reasons: string[];
    }>;
    notes: string[];
  };
  reviewWarnings: Array<{ message: string; code?: string }>;
  blockSummaries: Array<{
    id: string;
    title: string;
    addedCount: number;
    removedCount: number;
    changedCount: number;
    sampleLines?: string[];
  }>;
};

export type AiReviewSuggestionResult = {
  advisory: true;
  enabled: boolean;
  provider: AiProviderId;
  model?: string;
  status: AiReviewStatus;
  generatedAt: string;
  inputHash: string;
  summary?: string;
  sectionNotes?: AiReviewSectionNote[];
  disclaimers: string[];
  error?: string;
};

export type AiProviderStatus = 'disabled' | 'configured' | 'misconfigured' | 'unavailable';

export type AiProviderOptionView = {
  id: AiProviderId;
  label: string;
  status: AiProviderStatus;
  active: boolean;
  model: string | null;
  allowedModels: string[];
  statusMessage: string;
  hostedNote?: string;
};

export type AiProviderSettingsView = {
  activeProvider: AiProviderId;
  activeModel: string | null;
  switchingMode: 'env_only';
  switchingNote: string;
  providers: AiProviderOptionView[];
  disclaimers: string[];
};

export interface AiReviewProvider {
  readonly id: AiProviderId;
  generateSuggestions(input: AiReviewInput, inputHash: string): Promise<AiReviewSuggestionResult>;
}

export const AI_REVIEW_DISCLAIMERS = [
  'AI suggestions are advisory, may be wrong, and never change drafts, merge behavior, or the public site.',
  'AI does not decide merge or publish. Follow parser warnings and merge safety tables.',
  'External providers receive minimized review context only - not DOCX files or full raw document text.',
] as const;
