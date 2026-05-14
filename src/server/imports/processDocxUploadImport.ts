import 'server-only';

import { addUploadMetadata, saveUploadedFile } from '@/lib/storage';
import { parseDocxToDetails } from '@/parser/docxParser';
import { createUploadedFileAndImport } from '@/server/imports/createImport';
import { runDocxImportParseJob } from '@/server/imports/runDocxImportParseJob';
import type { DocxUploadWithImportResult } from '@/server/imports/runDocxImportParseJob';
import { validateDetails } from '@/validators/detailsSchema';

export { DocxImportParseError, type DocxUploadImportSummary, type DocxUploadWithImportResult } from '@/server/imports/runDocxImportParseJob';

function validationErrorsToStrings(errors: NonNullable<ReturnType<typeof validateDetails>['errors']>): string[] {
  return errors.map((e) => `${e.path.join('.')}: ${e.message}`);
}

/**
 * Saves DOCX, creates `UploadedFile` + `ContentImport`, then runs parse + persist synchronously.
 * Prefer the async upload API path (`after` + `runDocxImportParseJob`) for interactive admin uploads.
 */
export async function processDocxUploadWithImportPersistence(input: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  uploaderLabel: string | null;
}): Promise<DocxUploadWithImportResult> {
  const saved = await saveUploadedFile(input.buffer, input.originalName, input.uploaderLabel ?? undefined, {
    persistToLegacyUploadsMeta: false,
  });
  const storedPath = saved.storedPath;

  let importId: string | undefined;
  let uploadedFileId: string | undefined;

  try {
    const bundle = await createUploadedFileAndImport({
      originalName: input.originalName,
      storedPath,
      mimeType: input.mimeType,
      sizeBytes: saved.fileSizeBytes,
      sha256: saved.sha256,
      sourceFormat: 'DOCX',
    });
    uploadedFileId = bundle.uploadedFile.id;
    importId = bundle.import.id;
  } catch (e) {
    console.error('DOCX import DB persistence failed:', e);
    await addUploadMetadata({
      filename: saved.filename,
      originalName: input.originalName,
      uploadedAt: new Date().toISOString(),
      uploader: input.uploaderLabel ?? undefined,
      fileSizeBytes: saved.fileSizeBytes,
      sha256: saved.sha256,
      warnings: [],
      downloadUrl: `/uploads/${saved.filename}`,
    }).catch((err) => {
      console.warn('Failed to append legacy uploads manifest after DB failure:', err);
    });
    const { data, warnings } = await parseDocxToDetails(
      input.buffer,
      input.originalName,
      input.uploaderLabel ?? undefined,
    );
    const validation = validateDetails(data);
    return {
      data,
      parseWarnings: warnings,
      validation: {
        valid: validation.success,
        errors: validation.errors ? validationErrorsToStrings(validation.errors) : [],
      },
      import: {
        persisted: false,
        persistenceError: e instanceof Error ? e.message : 'Database error',
      },
    };
  }

  return runDocxImportParseJob({
    importId: importId!,
    uploadedFileId,
    buffer: input.buffer,
    originalName: input.originalName,
    mimeType: input.mimeType,
    uploaderLabel: input.uploaderLabel,
  });
}
