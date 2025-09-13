// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export interface Meta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

// Project Types
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  deletion_requested: boolean;
  deletion_requested_at: string | null;
  user: User;
  created_at: string;
  updated_at: string;
}

// Request Types
export interface CreateProjectRequest {
  project: {
    name: string;
    description: string;
    status?: 'draft' | 'active' | 'completed' | 'archived';
  };
}

export interface UpdateProjectRequest {
  project: {
    name?: string;
    description?: string;
    status?: 'draft' | 'active' | 'completed' | 'archived';
  };
}

// Query Parameters
export interface ProjectsQueryParams {
  status?: 'draft' | 'active' | 'completed' | 'archived';
  search?: string;
  page?: number;
  per_page?: number;
}
