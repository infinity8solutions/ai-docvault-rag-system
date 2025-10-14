'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  projectId: number;
  onUploadSuccess: () => void;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function DocumentUpload({ projectId, onUploadSuccess }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setError('');
      setUploading(true);

      try {
        const { documentService } = await import('@/lib/document');

        for (const file of acceptedFiles) {
          await documentService.uploadDocument(projectId, file);
        }

        onUploadSuccess();
      } catch (err: any) {
        setError(err.message || 'Failed to upload file');
      } finally {
        setUploading(false);
      }
    },
    [projectId, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400" />
              {isDragActive ? (
                <p className="text-sm text-blue-600 dark:text-blue-400">Drop files here...</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag & drop files here, or click to select files
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Supports: PDF, DOC, DOCX, TXT, MD, PNG, JPG, GIF, WEBP (Max 50MB)
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
