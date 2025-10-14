import { authService } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface Document {
  id: number;
  project_id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: string;
  mime_type: string;
  storage_path: string;
  ingestion_status: string;
  created_at: string;
  updated_at: string;
}

export const documentService = {
  async uploadDocument(projectId: number, file: File): Promise<Document> {
    const token = authService.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/document/upload/${projectId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload document');
    }

    return response.json();
  },

  async getDocumentsByProject(projectId: number): Promise<Document[]> {
    const token = authService.getToken();

    const response = await fetch(`${API_URL}/api/document/project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  },

  async getDocumentById(id: number): Promise<Document> {
    const token = authService.getToken();

    const response = await fetch(`${API_URL}/api/document/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return response.json();
  },

  async downloadDocument(id: number, originalFilename: string): Promise<void> {
    const token = authService.getToken();

    const response = await fetch(`${API_URL}/api/document/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async deleteDocument(id: number): Promise<void> {
    const token = authService.getToken();

    const response = await fetch(`${API_URL}/api/document/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  },

  async ingestDocument(id: number): Promise<{ message: string; document_id: number }> {
    const token = authService.getToken();

    const response = await fetch(`${API_URL}/api/document/${id}/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to ingest document');
    }

    return response.json();
  },
};
