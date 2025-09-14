import React from 'react';
import { vi } from 'vitest';
import type { User, Project, Task, UseProjectsReturn, UseTasksReturn } from '@/types';
import { createMockUser, createMockProject, createMockTask } from './utils';

// Mock react-router-dom
export const mockNavigate = vi.fn();
export const mockUseLocation = vi.fn(() => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: mockUseLocation,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock Sonner toast
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};

vi.mock('sonner', () => ({
  toast: mockToast,
  Toaster: ({ children }: { children?: React.ReactNode }) => children,
}));

// Mock useProjects hook
export const createMockUseProjects = (overrides?: Partial<UseProjectsReturn>): UseProjectsReturn => ({
  projects: [createMockProject()],
  isLoading: false,
  error: null,
  createProject: vi.fn().mockResolvedValue(createMockProject()),
  updateProject: vi.fn().mockResolvedValue(createMockProject()),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  refetch: vi.fn(),
  ...overrides,
});

// Mock useTasks hook
export const createMockUseTasks = (overrides?: Partial<UseTasksReturn>): UseTasksReturn => ({
  tasks: [createMockTask()],
  isLoading: false,
  error: null,
  createTask: vi.fn().mockResolvedValue(createMockTask()),
  updateTask: vi.fn().mockResolvedValue(createMockTask()),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  moveTask: vi.fn().mockResolvedValue(createMockTask()),
  refetch: vi.fn(),
  ...overrides,
});

// Mock custom hooks
export const mockHooks = {
  useProjects: vi.fn(),
  useTasks: vi.fn(),
  useAuth: vi.fn(),
  useTheme: vi.fn(),
};

// Mock API responses
export const mockApiResponses = {
  projects: {
    success: true,
    data: [createMockProject()],
    message: 'Projects fetched successfully',
  },
  tasks: {
    success: true,
    data: [createMockTask()],
    message: 'Tasks fetched successfully',
  },
  user: {
    success: true,
    data: createMockUser(),
    message: 'User authenticated successfully',
  },
};

// Mock DnD Kit
export const mockDndContext = {
  active: null,
  over: null,
  activatorEvent: null,
  collisions: null,
  droppableRects: new Map(),
  droppableContainers: new Map(),
  dragOverlay: {
    rect: null,
    node: null,
  },
};

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd, onDragStart }: any) => (
    <div data-testid="dnd-context" onMouseUp={onDragEnd} onMouseDown={onDragStart}>
      {children}
    </div>
  ),
  useDndContext: () => mockDndContext,
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  closestCenter: vi.fn(),
  closestCorners: vi.fn(),
  rectIntersection: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
  horizontalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
}));

// Mock React Query
export const createMockQuery = <T>(data: T, overrides?: any) => ({
  data,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  ...overrides,
});

export const createMockMutation = (overrides?: any) => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: false,
  isError: false,
  error: null,
  data: null,
  reset: vi.fn(),
  ...overrides,
});

// Mock Radix UI components
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children }: { children: React.ReactNode }) => children,
  Portal: ({ children }: { children: React.ReactNode }) => children,
  Overlay: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Close: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Title: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  Description: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

vi.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: { children: React.ReactNode }) => children,
  Trigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Item: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Separator: (props: any) => <div {...props} />,
}));

// Mock browser APIs
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    themes: ['light', 'dark', 'system'],
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock file operations
export const createMockFile = (name: string, content: string, type: string = 'text/plain') => {
  const file = new File([content], name, { type });
  return file;
};

// Clipboard API is now mocked in setup.ts to avoid redefinition errors

// Mock service container for non-service tests
vi.mock('@/services/container/ServiceContainer', () => ({
  ServiceContainer: vi.fn(),
  getContainer: vi.fn(),
  resetContainer: vi.fn(),
  resolve: vi.fn(),
  tryResolve: vi.fn(),
}));

// Export all mocks
export * from './utils';
export * from './mocks/services';
export * from './mocks/container';
