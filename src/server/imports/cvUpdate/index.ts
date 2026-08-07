/**
 * Public API for CV update change-set generation and validation.
 */

export type {
  AcceptedCvNormalizedSnapshot,
  CvAcceptedBaselineRef,
  CvChangeDecision,
  CvChangeDecisionAction,
  CvChangeDecisionsEnvelope,
  CvChangeItem,
  CvChangeKind,
  CvChangeSectionKey,
  CvChangeSectionSummary,
  CvChangeSet,
  CvChangeSetSummary,
  CvUnknownSectionProposal,
  CvWebsiteRef,
  NormalizedListItem,
} from '@/server/imports/cvUpdate/changeSetTypes';

export {
  CV_CONTROLLED_SECTIONS,
  REVIEW_CONTROLLED_FIELDS,
  WEBSITE_CONTROLLED_FIELDS,
  isWebsiteControlledPath,
  ownershipForFieldPath,
  type FieldOwnershipClass,
  type FieldOwnershipRule,
} from '@/server/imports/cvUpdate/fieldOwnership';

export {
  buildAcceptedCvNormalizedSnapshot,
  parseAcceptedCvNormalizedSnapshot,
} from '@/server/imports/cvUpdate/normalizeBaseline';

export {
  detectTruncatedCandidate,
  fingerprintText,
  type TruncationVerdict,
} from '@/server/imports/cvUpdate/truncationDetect';

export {
  buildDynamicSectionFromCvText,
  mergeDynamicSectionIntoSiteContent,
  stripHtmlTags,
  type BuildDynamicSectionInput,
} from '@/server/imports/cvUpdate/dynamicSections';

export {
  applyAcceptedChangePatches,
  applyAcceptedDynamicSections,
  resolveOwnershipFreezesFromChangeSet,
} from '@/server/imports/cvUpdate/applyChangeDecisions';

export {
  generateCvChangeSet,
  SECTION_LABELS,
  type GenerateCvChangeSetInput,
} from '@/server/imports/cvUpdate/changeSetGenerate';

export {
  CvChangeDecisionSchema,
  CvChangeDecisionsEnvelopeSchema,
  CvChangeItemSchema,
  CvChangeSetSchema,
  parseCvChangeDecisionsEnvelope,
  parseCvChangeSet,
} from '@/server/imports/cvUpdate/changeSetSchema';

export {
  logImportOperation,
  withImportOperationTiming,
  withImportOperationTimingSync,
  type ImportOpName,
  type ImportOpOutcome,
} from '@/server/imports/cvUpdate/instrumentation';

export {
  CvChangeSetError,
  loadImportChangeDecisions,
  loadImportChangeSet,
  persistImportChangeDecisions,
  persistImportChangeSet,
} from '@/server/imports/cvUpdate/persistChangeSet';

export { generateAndPersistImportChangeSet } from '@/server/imports/cvUpdate/generateAndPersistChangeSet';

export { upsertImportFieldLock, listImportFieldLocks } from '@/server/imports/cvUpdate/fieldLocks';

export { upsertCvSectionMapping, listCvSectionMappings } from '@/server/imports/cvUpdate/sectionMappings';

export {
  decisionsFromEnvelope,
  toChangeSetSummaryCompact,
  toProfessorChangeSetDto,
  type ImportChangeSetSummaryCompact,
  type ProfessorChangeItemDto,
  type ProfessorChangeSetDto,
} from '@/server/imports/cvUpdate/professorChangeSetDto';
