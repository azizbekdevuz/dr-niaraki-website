/**
 * Admin upload DOCX API route
 * POST: Upload and parse DOCX file, or confirm commit
 */

import path from 'path';

import { after } from 'next/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { hasValidAdminAccess } from '@/lib/admin-auth';
import { commitDetailsJson, isGitHubConfigured } from '@/lib/github';
import { addUploadMetadata, saveUploadedFile, saveDetailsPreview } from '@/lib/storage';
import { parseDocxToDetails } from '@/parser/docxParser';
import { createUploadedFileAndImport } from '@/server/imports/createImport';
import { scheduleDocxImportParseAfterResponse } from '@/server/imports/runDocxImportParseJob';
import type { Details } from '@/types/details';
import { validateDetails } from '@/validators/detailsSchema';

/**
 * POST: Handle DOCX upload
 */
export async function POST(request: NextRequest) {
  try {
    const accessStatus = await hasValidAdminAccess();

    if (!accessStatus.isLoggedIn) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - please login' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(request, accessStatus);
    }

    // Handle JSON (confirm commit)
    if (contentType.includes('application/json')) {
      return handleConfirmCommit(request, accessStatus);
    }

    return NextResponse.json(
      { success: false, message: 'Invalid content type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handles DOCX file upload and parsing
 */
async function handleFileUpload(
  request: NextRequest,
  accessStatus: { isLoggedIn: boolean; hasValidDevice: boolean }
) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, message: 'No file uploaded' },
      { status: 400 }
    );
  }

  // Validate file type
  if (!file.name.endsWith('.docx')) {
    return NextResponse.json(
      { success: false, message: 'Only .docx files are supported' },
      { status: 400 }
    );
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, message: 'File too large (max 10MB)' },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const uploader = 'admin';
  const mimeType =
    file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const saveStarted = Date.now();
  const saved = await saveUploadedFile(buffer, file.name, uploader, {
    persistToLegacyUploadsMeta: false,
  });
  const saveMs = Date.now() - saveStarted;

  let importId: string;
  let uploadedFileId: string;
  try {
    const createStarted = Date.now();
    const bundle = await createUploadedFileAndImport({
      originalName: file.name,
      storedPath: saved.storedPath,
      mimeType,
      sizeBytes: saved.fileSizeBytes,
      sha256: saved.sha256,
      sourceFormat: 'DOCX',
    });
    const createMs = Date.now() - createStarted;
    importId = bundle.import.id;
    uploadedFileId = bundle.uploadedFile.id;

    scheduleDocxImportParseAfterResponse(after, {
      importId,
      uploadedFileId,
      buffer,
      originalName: file.name,
      mimeType,
      uploaderLabel: uploader,
    });

    console.warn(
      JSON.stringify({
        event: 'docx_upload_enqueue',
        importId,
        uploadedFileId,
        saveMs,
        createMs,
        status: 'UPLOADED',
      }),
    );

    return NextResponse.json({
      success: true,
      importId,
      status: 'UPLOADED',
      message:
        'Import created. Parsing runs after this response — the preview will load automatically when parsing finishes.',
      canCommit: accessStatus.hasValidDevice,
      deviceRequired: !accessStatus.hasValidDevice,
      import: {
        persisted: true,
        importId,
        uploadedFileId,
        status: 'UPLOADED',
      },
      legacyUploadMetaNote:
        'Filesystem `public/uploads/uploads_meta.json` (and optional GitHub mirror) is for filenames and download history only. Prisma `UploadedFile` / `ContentImport` are authoritative for imports and review.',
    });
  } catch (e) {
    console.error('DOCX import DB persistence failed:', e);
    await addUploadMetadata({
      filename: saved.filename,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      uploader,
      fileSizeBytes: saved.fileSizeBytes,
      sha256: saved.sha256,
      warnings: [],
      downloadUrl: `/uploads/${saved.filename}`,
    }).catch((err) => {
      console.warn('Failed to append legacy uploads manifest after DB failure:', err);
    });

    const { data, warnings } = await parseDocxToDetails(buffer, file.name, uploader);
    const validation = validateDetails(data);
    return NextResponse.json({
      success: false,
      message: 'Could not save import to the database. Parsed preview is shown for recovery only.',
      persistenceError: e instanceof Error ? e.message : 'Database error',
      data,
      warnings: warnings.map((w) => `${w.field}: ${w.message}`),
      validation: {
        valid: validation.success,
        errors: validation.errors?.map((err) => `${err.path.join('.')}: ${err.message}`) || [],
      },
      canCommit: accessStatus.hasValidDevice,
      deviceRequired: !accessStatus.hasValidDevice,
      import: { persisted: false },
      legacyUploadMetaNote:
        'Filesystem `public/uploads/uploads_meta.json` (and optional GitHub mirror) is for filenames and download history only. Prisma `UploadedFile` / `ContentImport` are authoritative for imports and review.',
    });
  }
}

/**
 * Handles confirm commit request
 */
async function handleConfirmCommit(
  request: NextRequest,
  accessStatus: { isLoggedIn: boolean; hasValidDevice: boolean }
) {
  // Require valid device for commit
  if (!accessStatus.hasValidDevice) {
    return NextResponse.json(
      {
        success: false,
        message: 'Device not registered. Please register this device before committing.'
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { data, acknowledgeWarnings, originalFilename } = body;

  if (!data) {
    return NextResponse.json(
      { success: false, message: 'No data provided' },
      { status: 400 }
    );
  }

  // Validate final data
  const validation = validateDetails(data);
  if (!validation.success && !acknowledgeWarnings) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validation failed. Check warnings and acknowledge to proceed.',
        errors: validation.errors?.map(e => `${e.path.join('.')}: ${e.message}`) || [],
      },
      { status: 400 }
    );
  }

  const detailsData = data as Details;

  if (originalFilename && typeof body.fileBuffer === 'string') {
    try {
      const sanitizedFilename = path.basename(originalFilename);
      const fileBuffer = Buffer.from(body.fileBuffer, 'base64');
      await saveUploadedFile(fileBuffer, sanitizedFilename, 'admin');
    } catch (error) {
      console.error('Failed to save uploaded file:', error);
    }
  }

  // Try to commit to GitHub
  if (isGitHubConfigured()) {
    try {
      const result = await commitDetailsJson(detailsData, 'admin');

      if (result) {
        return NextResponse.json({
          success: true,
          message: 'Data committed successfully',
          commitSha: result.sha,
          commitUrl: result.url,
          editorialPath: 'legacy_github_details_json',
          legacyDetailsJsonCommit: true,
          notPrismaWorkflow: true,
          importDomainNote:
            'Legacy path: writes details.json via GitHub only. It does not create or update Prisma ContentImport rows.',
        });
      }
    } catch (error) {
      console.error('GitHub commit failed:', error);
      // Fall through to fallback
    }
  }

  // Fallback: save preview file
  const previewUrl = await saveDetailsPreview(detailsData);

  return NextResponse.json({
    success: true,
    message: 'GitHub commit not available. Preview saved locally.',
    previewUrl,
    instructions: 'Please manually copy the preview file to src/datasets/details.json and deploy.',
    editorialPath: 'legacy_github_details_json_preview',
    legacyDetailsJsonCommit: true,
    notPrismaWorkflow: true,
    importDomainNote:
      'Legacy path: preview JSON only. It does not create or update Prisma ContentImport rows.',
  });
}
