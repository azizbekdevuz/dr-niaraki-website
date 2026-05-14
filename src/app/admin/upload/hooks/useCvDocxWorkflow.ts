'use client';

import { useCallback, useRef, useState } from 'react';

import type { Details } from '@/types/details';

import type { CvPreviewTabId } from '../uploadTypes';

type RouterLike = { push: (href: string) => void };

const READY_STATUSES = new Set(['PARSED', 'NEEDS_REVIEW']);
const FAILED_STATUSES = new Set(['FAILED']);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function importWarningsToStrings(warnings: unknown): string[] {
  if (!Array.isArray(warnings)) {
    return [];
  }
  return warnings.map((w) => {
    if (typeof w === 'string') {
      return w;
    }
    if (w && typeof w === 'object' && 'message' in w && typeof (w as { message: unknown }).message === 'string') {
      const code = 'code' in w && typeof (w as { code: unknown }).code === 'string' ? `${(w as { code: string }).code}: ` : '';
      return `${code}${(w as { message: string }).message}`;
    }
    try {
      return JSON.stringify(w);
    } catch {
      return String(w);
    }
  });
}

export type CvImportPhase = 'idle' | 'uploading' | 'processing' | 'failed' | 'ready';

export function useCvDocxWorkflow(router: RouterLike) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [parsedData, setParsedData] = useState<Details | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [acknowledgeWarnings, setAcknowledgeWarnings] = useState(false);
  const [activeTab, setActiveTab] = useState<CvPreviewTabId>('profile');

  const [commitSha, setCommitSha] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);
  const [commitDomainNote, setCommitDomainNote] = useState<string | null>(null);
  const [uploadMetaNote, setUploadMetaNote] = useState<string | null>(null);

  const [importPhase, setImportPhase] = useState<CvImportPhase>('idle');
  const [trackedImportId, setTrackedImportId] = useState<string | null>(null);

  const pollAbortRef = useRef(false);

  const pollUntilParsed = useCallback(async (importId: string) => {
    pollAbortRef.current = false;
    const maxAttempts = 120;
    for (let i = 0; i < maxAttempts; i++) {
      if (pollAbortRef.current) {
        return;
      }
      await sleep(1000);
      if (pollAbortRef.current) {
        return;
      }

      if (i === 15) {
        void fetch(`/api/admin/imports/${importId}/process`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => {
          /* non-fatal belt for flaky after() */
        });
      }

      const res = await fetch(`/api/admin/imports/${importId}`, { credentials: 'include' });
      let data: { ok?: boolean; import?: { status?: string; candidatePayload?: Details; warnings?: unknown } };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setError('Could not read import status from server.');
        setImportPhase('failed');
        return;
      }
      if (!res.ok || !data.ok || !data.import) {
        setError('Failed to load import status.');
        setImportPhase('failed');
        return;
      }

      const st = data.import.status ?? '';
      if (FAILED_STATUSES.has(st)) {
        setWarnings(importWarningsToStrings(data.import.warnings));
        setValidationErrors([]);
        setParsedData(null);
        setImportPhase('failed');
        setError('Parsing failed for this import. Check warnings or re-upload the DOCX.');
        return;
      }
      if (READY_STATUSES.has(st) && data.import.candidatePayload) {
        setParsedData(data.import.candidatePayload);
        setWarnings(importWarningsToStrings(data.import.warnings));
        setValidationErrors([]);
        setImportPhase('ready');
        setTrackedImportId(null);
        return;
      }
    }
    setImportPhase('failed');
    setError('Parsing is taking longer than expected. Open CV imports or refresh this page.');
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.docx')) {
        setError('Only .docx files are supported');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setParsedData(null);
      setWarnings([]);
      setValidationErrors([]);
      setCommitSha(null);
      setCommitUrl(null);
      setImportPhase('idle');
      setTrackedImportId(null);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);
    setImportPhase('uploading');
    setTrackedImportId(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      let data: {
        success?: boolean;
        message?: string;
        importId?: string;
        status?: string;
        import?: { persisted?: boolean; importId?: string; status?: string };
        data?: Details;
        warnings?: string[];
        validation?: { valid?: boolean; errors?: string[] };
        persistenceError?: string;
        legacyUploadMetaNote?: string;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        setError('Upload failed — could not read server response.');
        setImportPhase('failed');
        return;
      }

      setUploadMetaNote(typeof data.legacyUploadMetaNote === 'string' ? data.legacyUploadMetaNote : null);

      if (!data.success) {
        if (data.data) {
          setParsedData(data.data);
          setWarnings(data.warnings || []);
          setValidationErrors(data.validation?.errors || []);
        }
        setError(data.message || 'Upload failed');
        setImportPhase(data.data ? 'idle' : 'failed');
        return;
      }

      const importId = typeof data.importId === 'string' ? data.importId : data.import?.importId;
      if (!importId) {
        setError('Server did not return an import id.');
        setImportPhase('failed');
        return;
      }

      setTrackedImportId(importId);
      setImportPhase('processing');
      await pollUntilParsed(importId);
    } catch {
      setError('Failed to upload file');
      setImportPhase('failed');
    } finally {
      setUploading(false);
    }
  }, [file, pollUntilParsed]);

  const handleCommit = useCallback(async () => {
    if (!parsedData) {
      return;
    }

    setCommitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          data: parsedData,
          acknowledgeWarnings,
          originalFilename: file?.name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCommitDomainNote(typeof data.importDomainNote === 'string' ? data.importDomainNote : null);
        if (data.commitSha) {
          setCommitSha(data.commitSha);
          setCommitUrl(data.commitUrl);
          setSuccess(
            data.legacyDetailsJsonCommit
              ? 'Legacy JSON commit completed (GitHub). This does not update the live DB-backed site by itself — use Imports → merge → publish for the modern path.'
              : 'Data committed successfully! Vercel will auto-deploy.',
          );
        } else {
          setSuccess(data.message);
        }
      } else {
        setError(data.message || 'Commit failed');
      }
    } catch {
      setError('Failed to commit changes');
    } finally {
      setCommitting(false);
    }
  }, [parsedData, acknowledgeWarnings, file]);

  const startOver = useCallback(() => {
    pollAbortRef.current = true;
    setParsedData(null);
    setFile(null);
    setWarnings([]);
    setValidationErrors([]);
    setImportPhase('idle');
    setTrackedImportId(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      pollAbortRef.current = true;
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
      router.push('/admin');
    } catch {
      setError('Failed to logout');
    }
  }, [router]);

  return {
    file,
    handleFileChange,
    uploading,
    importPhase,
    trackedImportId,
    parsedData,
    warnings,
    validationErrors,
    acknowledgeWarnings,
    setAcknowledgeWarnings,
    activeTab,
    setActiveTab,
    handleUpload,
    handleCommit,
    committing,
    startOver,
    error,
    success,
    commitSha,
    commitUrl,
    commitDomainNote,
    uploadMetaNote,
    handleLogout,
  };
}
