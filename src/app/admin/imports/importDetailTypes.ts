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
  blocks: ImportReviewBlockModel[];
  warnings: { message: string; code?: string }[];
  provenance: ImportReviewProvenanceModel | null;
  legacyUploadsMetaNote: string;
};
