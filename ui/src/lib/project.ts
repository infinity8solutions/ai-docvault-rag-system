import { authService } from './auth';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const projectService = {
  async getAllProjects(): Promise<Project[]> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/api/project`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  },

  async getProjectById(id: number): Promise<Project> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/api/project/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  },

  async createProject(data: CreateProjectDto): Promise<Project> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/api/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    return response.json();
  },

  async updateProject(id: number, data: UpdateProjectDto): Promise<Project> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/api/project/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  },

  async deleteProject(id: number): Promise<void> {
    const token = authService.getToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${API_URL}/api/project/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },
};
