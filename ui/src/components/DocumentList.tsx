'use client';

import { useState } from 'react';
import { FileText, Image, File, Download, Trash2, Loader2, Database } from 'lucide-react';
import { Document } from '@/lib/document';
import Modal from './Modal';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: number) => void;
  onDownload: (id: number, filename: string) => void;
  onIngest: (id: number) => void;
}

// Helper to format file size
const formatFileSize = (bytes: string): string => {
  const size = parseInt(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper to get file icon
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return <Image className="w-8 h-8 text-purple-600" />;
    case 'document':
      return <FileText className="w-8 h-8 text-blue-600" />;
    default:
      return <File className="w-8 h-8 text-gray-600" />;
  }
};

export default function DocumentList({ documents, onDelete, onDownload, onIngest }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [ingestingId, setIngestingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const handleDelete = async () => {
    if (!selectedDoc) return;

    setDeletingId(selectedDoc.id);
    try {
      await onDelete(selectedDoc.id);
      setShowDeleteModal(false);
      setSelectedDoc(null);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    setDownloadingId(doc.id);
    try {
      await onDownload(doc.id, doc.original_filename);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const openDeleteModal = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const handleIngest = async (doc: Document) => {
    setIngestingId(doc.id);
    try {
      await onIngest(doc.id);
    } catch (error) {
      console.error('Ingest failed:', error);
    } finally {
      setIngestingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">{getFileIcon(doc.file_type)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate" title={doc.original_filename}>
                  {doc.original_filename}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatFileSize(doc.file_size)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDate(doc.created_at)}
                </p>
                {/* Ingestion Status Badge */}
                <div className="mt-2">
                  {doc.ingestion_status === 'ingested' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                      <Database className="w-3 h-3" />
                      Ingested
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {downloadingId === doc.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download
                    </>
                  )}
                </button>
                <button
                  onClick={() => openDeleteModal(doc)}
                  disabled={deletingId === doc.id}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Ingest button - show for PDFs and images that haven't been ingested */}
              {(doc.mime_type === 'application/pdf' ||
                doc.mime_type === 'image/png' ||
                doc.mime_type === 'image/jpeg' ||
                doc.mime_type === 'image/jpg') &&
                doc.ingestion_status === 'pending' && (
                <button
                  onClick={() => handleIngest(doc)}
                  disabled={ingestingId === doc.id}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {ingestingId === doc.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ingesting...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      Ingest into Vector Store
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {selectedDoc && (
        <Modal
          open={showDeleteModal}
          onOpenChange={(open) => {
            setShowDeleteModal(open);
            if (!open) setSelectedDoc(null);
          }}
          title="Delete Document"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete <strong>{selectedDoc.original_filename}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deletingId === selectedDoc.id}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deletingId === selectedDoc.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
