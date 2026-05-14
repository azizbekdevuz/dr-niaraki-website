import 'server-only';

import type { ImportStatus, Prisma } from '@prisma/client';

import { PARSER_VERSION, parseDocxToDetails } from '@/parser/docxParser';
import {
  buildDocxRawExtractEnvelope,
  detailsCandidateForImportStorage,
  heuristicImportWarnings,
  mergeImportWarningLists,
  parseWarningsToImportItems,
  resolveImportStatusAfterParse,
  zodIssuesToImportItems,
} from '@/server/imports/docxImportArtifacts';
import {
  persistImportParseFailure,
  persistImportParseOutcome,
} from '@/server/imports/repository';
import type { Details } from '@/types/details';
import type { ParseWarning } from '@/types/parser';
import { validateDetails } from '@/validators/detailsSchema';

export type DocxUploadImportSummary = {
  persisted: boolean;
  persistenceError?: string;
  uploadedFileId?: string;
  importId?: string;
  status?: ImportStatus;
  parserVersion?: string | null;
  warningCount?: number;
};

export type DocxUploadWithImportResult = {
  data: Details;
  parseWarnings: ParseWarning[];
  validation: { valid: boolean; errors: string[] };
  import: DocxUploadImportSummary;
};

/** Thrown when DOCX parsing throws after an import row was created — import is marked `FAILED` first. */
export class DocxImportParseError extends Error {
  constructor(
    message: string,
    readonly importSummary: DocxUploadImportSummary,
  ) {
    super(message);
    this.name = 'DocxImportParseError';
  }
}

function validationErrorsToStrings(errors: NonNullable<ReturnType<typeof validateDetails>['errors']>): string[] {
  return errors.map((e) => `${e.path.join('.')}: ${e.message}`);
}

function logParseEvent(payload: Record<string, unknown>) {
  console.warn(
    JSON.stringify({
      event: 'docx_import_parse',
      ...payload,
    }),
  );
}

/**
 * Runs mammoth parse + validation + `persistImportParseOutcome` / `persistImportParseFailure` for an existing import.
 * Caller must have created `ContentImport` (`UPLOADED`) and stored bytes already.
 */
export async function runDocxImportParseJob(input: {
  importId: string;
  uploadedFileId?: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  uploaderLabel: string | null;
}): Promise<DocxUploadWithImportResult> {
  const jobStarted = Date.now();
  let parseMs = 0;
  let persistMs = 0;

  const uploadedFileId = input.uploadedFileId;

  try {
    const parseStart = Date.now();
    const { data, warnings } = await parseDocxToDetails(
      input.buffer,
      input.originalName,
      input.uploaderLabel ?? undefined,
    );
    parseMs = Date.now() - parseStart;

    const validation = validateDetails(data);
    const validationErrors = validation.errors ? validationErrorsToStrings(validation.errors) : [];
    const importWarnings = mergeImportWarningLists(
      parseWarningsToImportItems(warnings),
      zodIssuesToImportItems(validation.errors),
      heuristicImportWarnings(data),
    );
    const rawExtract = buildDocxRawExtractEnvelope({
      parserVersion: PARSER_VERSION,
      sourceFileName: input.originalName,
      parsedAt: data.meta.parsedAt,
      uploaderLabel: input.uploaderLabel,
      details: data,
      validationSuccess: validation.success,
      validationErrors,
      parseWarnings: warnings,
    });
    const status: ImportStatus = resolveImportStatusAfterParse({
      validationSuccess: validation.success,
      parseWarnings: warnings,
    });
    const candidateJson = detailsCandidateForImportStorage(data);

    const persistStart = Date.now();
    await persistImportParseOutcome(input.importId, {
      rawExtract,
      candidatePayload: candidateJson as Prisma.InputJsonValue,
      warnings: importWarnings as Prisma.InputJsonValue,
      status,
      parserVersion: PARSER_VERSION,
    });
    persistMs = Date.now() - persistStart;

    logParseEvent({
      importId: input.importId,
      uploadedFileId: uploadedFileId ?? null,
      parseMs,
      persistMs,
      totalMs: Date.now() - jobStarted,
      finalStatus: status,
    });

    return {
      data,
      parseWarnings: warnings,
      validation: { valid: validation.success, errors: validationErrors },
      import: {
        persisted: true,
        uploadedFileId,
        importId: input.importId,
        status,
        parserVersion: PARSER_VERSION,
        warningCount: importWarnings.length,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Parse failed';
    await persistImportParseFailure(input.importId, {
      parserVersion: PARSER_VERSION,
      warnings: [
        {
          code: 'PARSE_EXCEPTION',
          message,
        },
      ] as Prisma.InputJsonValue,
    });
    logParseEvent({
      importId: input.importId,
      uploadedFileId: uploadedFileId ?? null,
      parseMs,
      persistMs,
      totalMs: Date.now() - jobStarted,
      finalStatus: 'FAILED',
      error: message,
    });
    const summary: DocxUploadImportSummary = {
      persisted: true,
      uploadedFileId,
      importId: input.importId,
      status: 'FAILED',
      parserVersion: PARSER_VERSION,
      warningCount: 1,
    };
    throw new DocxImportParseError(message, summary);
  }
}

/**
 * Schedules `runDocxImportParseJob` via Next.js `after()` (or injectable stub in tests).
 * Copies the buffer so the scheduled task is not tied to the request buffer lifetime.
 */
export function scheduleDocxImportParseAfterResponse(
  afterFn: (task: () => void | Promise<void>) => void,
  input: {
    importId: string;
    uploadedFileId: string;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    uploaderLabel: string | null;
  },
): void {
  const parseBuffer = Buffer.from(input.buffer);
  afterFn(async () => {
    try {
      await runDocxImportParseJob({
        importId: input.importId,
        uploadedFileId: input.uploadedFileId,
        buffer: parseBuffer,
        originalName: input.originalName,
        mimeType: input.mimeType,
        uploaderLabel: input.uploaderLabel,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof DocxImportParseError) {
        console.warn(
          JSON.stringify({
            event: 'docx_upload_after_parse_failed',
            importId: input.importId,
            message: msg,
          }),
        );
        return;
      }
      console.error(
        JSON.stringify({
          event: 'docx_upload_after_parse_unexpected',
          importId: input.importId,
          message: msg,
        }),
      );
    }
  });
}
