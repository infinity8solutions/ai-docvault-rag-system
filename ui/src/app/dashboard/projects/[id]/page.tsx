'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, Project } from '@/lib/project';
import { documentService, Document } from '@/lib/document';
import Navbar from '@/components/Navbar';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import { ArrowLeft, Save, Loader2, FolderOpen, FileText } from 'lucide-react';

type TabType = 'details' | 'documents';

export default function ProjectDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.id as string);

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [activeTab, setActiveTab] = useState<TabType>('details');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !isNaN(projectId)) {
      loadProject();
    }
  }, [isAuthenticated, projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getProjectById(projectId);
      setProject(data);
      setFormData({
        name: data.name,
        description: data.description || '',
      });
      await loadDocuments();
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getDocumentsByProject(projectId);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const updated = await projectService.updateProject(projectId, formData);
      setProject(updated);
      alert('Project updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSuccess = () => {
    loadDocuments();
  };

  const handleDeleteDocument = async (id: number) => {
    await documentService.deleteDocument(id);
    loadDocuments();
  };

  const handleDownloadDocument = async (id: number, filename: string) => {
    await documentService.downloadDocument(id, filename);
  };

  const handleIngestDocument = async (id: number) => {
    try {
      await documentService.ingestDocument(id);
      // Reload documents to show updated ingestion status
      await loadDocuments();
    } catch (error) {
      console.error('Failed to ingest document:', error);
      alert(error instanceof Error ? error.message : 'Failed to ingest document');
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Project not found</h2>
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="text-blue-600 hover:text-blue-700"
            >
              Go back to projects
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/dashboard/projects')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>

        {/* Project Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{project.description || 'No description'}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('details')}
                className={`
                  flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <FolderOpen className="w-5 h-5" />
                Project Details
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`
                  flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'documents'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <FileText className="w-5 h-5" />
                Documents ({documents.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Project Details Tab */}
            {activeTab === 'details' && (
              <div>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      minLength={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="My Project"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Brief description of your project"
                    />
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Created:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(project.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(project.updated_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/projects')}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-8">
                {/* Upload Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Documents</h3>
                  <DocumentUpload projectId={projectId} onUploadSuccess={handleUploadSuccess} />
                </div>

                {/* Documents List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    All Documents
                  </h3>
                  <DocumentList
                    documents={documents}
                    onDelete={handleDeleteDocument}
                    onDownload={handleDownloadDocument}
                    onIngest={handleIngestDocument}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
