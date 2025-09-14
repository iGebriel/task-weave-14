// Core Domain Types
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'progress' | 'done';
export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';
export type UserRole = 'owner' | 'collaborator' | 'viewer';

// User Interface
export interface User {
  id: number | string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt?: Date;
  projectsCount?: number;
  tasksCompleted?: number;
}

// Project Interface
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  isPublic: boolean;
  owner: string;
  collaborators: number;
  tasksCount: number;
  completedTasks: number;
  createdAt: Date;
  updatedAt?: Date;
  deletionRequested?: boolean;
  deletionRequestedAt?: Date;
}

// Task Interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee?: string;
  assigneeId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  projectId: string;
  columnId?: string;
  position?: number;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  attachments?: Attachment[];
}

// Column Interface (for Kanban boards)
export interface Column {
  id: string;
  title: string;
  status: TaskStatus;
  position: number;
  projectId: string;
  taskIds: string[];
  color?: string;
  isCollapsed?: boolean;
  taskLimit?: number;
}

// Attachment Interface
export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Comment Interface
export interface Comment {
  id: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: Date;
  updatedAt?: Date;
  taskId?: string;
  projectId?: string;
  mentions?: string[];
  isEdited?: boolean;
}

// Notification Interface
export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'project_updated' | 'mention' | 'due_date' | 'comment';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  userId: string;
  entityId?: string;
  entityType?: 'task' | 'project' | 'comment';
  actionUrl?: string;
}

// Activity Log Interface
export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  entityId: string;
  entityType: 'task' | 'project' | 'comment';
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Form Data Interfaces
export interface CreateProjectData {
  name: string;
  description: string;
  status?: ProjectStatus;
  isPublic?: boolean;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  isPublic?: boolean;
}

export interface CreateTaskData {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: Date;
  projectId: string;
  columnId?: string;
  tags?: string[];
  estimatedHours?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: Date;
  columnId?: string;
  position?: number;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

// UI State Interfaces
export interface TaskFormState {
  title: string;
  description: string;
  priority: Priority;
  assignee: string;
  dueDate: string;
  tags: string[];
  estimatedHours: number;
}

export interface ProjectFormState {
  name: string;
  description: string;
  status: ProjectStatus;
  isPublic: boolean;
}

// Filter and Sort Interfaces
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: Priority[];
  assignee?: string[];
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  tags?: string[];
  overdue?: boolean;
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  owner?: string[];
  isPublic?: boolean;
  createdDate?: {
    from?: Date;
    to?: Date;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// API Response Interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Component Props Interfaces
export interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  isDragging?: boolean;
}

export interface ProjectCardProps {
  project: Project;
  onProjectSelect?: (project: Project) => void;
  onProjectUpdate?: (project: Project) => void;
  onProjectDelete?: (projectId: string) => void;
}

export interface ColumnProps {
  column: Column;
  tasks: Task[];
  onTaskUpdate?: (task: Task) => void;
  onTaskAdd?: (columnId: string, task: CreateTaskData) => void;
  onTaskMove?: (taskId: string, newColumnId: string, newPosition: number) => void;
}

// Hook Return Types
export interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: Error | null;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refetch: () => void;
}

export interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  createTask: (data: CreateTaskData) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, newColumnId: string, newPosition: number) => Promise<Task>;
  refetch: () => void;
}

// Context Interfaces
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  isLoading: boolean;
}

// Event Interfaces
export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current?: {
        type: string;
        task?: Task;
        column?: Column;
      };
    };
  };
  over: {
    id: string;
    data: {
      current?: {
        type: string;
        column?: Column;
        accepts?: string[];
      };
    };
  } | null;
}

// Error Interfaces
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Theme and UI Interfaces
export interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Export re-exports from API types for backward compatibility
export type { User as ApiUser, Project as ApiProject } from './api';
export * from './api';
