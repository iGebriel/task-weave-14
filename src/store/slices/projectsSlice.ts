import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '@/types';

interface ProjectsState {
  items: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  dataSource: 'api' | 'sample';
}

const initialState: ProjectsState = {
  items: [],
  currentProject: null,
  loading: false,
  error: null,
  dataSource: 'sample',
};

export const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setProjects: (state, action: PayloadAction<{ projects: Project[]; source: 'api' | 'sample' }>) => {
      state.items = action.payload.projects;
      state.dataSource = action.payload.source;
      state.loading = false;
      state.error = null;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.items.unshift(action.payload);
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(p => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

// Action creators
export const {
  setLoading,
  setError,
  setProjects,
  addProject,
  updateProject,
  removeProject,
  setCurrentProject,
  clearError,
} = projectsSlice.actions;

// Selectors
export const selectProjects = (state: { projects: ProjectsState }) => state.projects.items;
export const selectCurrentProject = (state: { projects: ProjectsState }) => state.projects.currentProject;
export const selectProjectsLoading = (state: { projects: ProjectsState }) => state.projects.loading;
export const selectProjectsError = (state: { projects: ProjectsState }) => state.projects.error;
export const selectDataSource = (state: { projects: ProjectsState }) => state.projects.dataSource;

// Statistics selectors
export const selectProjectStatistics = (state: { projects: ProjectsState }) => {
  const projects = state.projects.items;
  return {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    draft: projects.filter(p => p.status === 'draft').length,
    archived: projects.filter(p => p.status === 'archived').length,
  };
};

export default projectsSlice.reducer;