import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsQueryParams,
} from '@/types/api';
import { useApiPaginatedQuery, useApiMutation, useApiMutationVoid } from './useApiQuery';
import { toast } from 'sonner';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectsQueryParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// Get all projects with optional filters - using generic API utility
export const useProjects = (params: ProjectsQueryParams = {}) => {
  console.log('useProjects hook called with params:', params);

  return useApiPaginatedQuery(
    projectKeys.list(params),
    (queryParams) => {
      console.log('Calling apiClient.getProjects with params:', queryParams);
      return apiClient.getProjects(queryParams);
    },
    params
  );
};

// Get single project
export const useProject = (id: number) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getProject(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch project');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Create project mutation - using generic API utility
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data: CreateProjectRequest) => apiClient.createProject(data),
    {
      successMessage: 'Project created successfully!',
      errorMessage: 'Failed to create project',
      invalidateQueries: [projectKeys.lists()],
      onSuccess: (newProject) => {
        // Add the new project to the cache
        queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
      },
    }
  );
};

// Update project mutation - using generic API utility
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, data }: { id: number; data: UpdateProjectRequest }) => apiClient.updateProject(id, data),
    {
      successMessage: 'Project updated successfully!',
      errorMessage: 'Failed to update project',
      invalidateQueries: [projectKeys.lists()],
      onSuccess: (updatedProject) => {
        // Update the specific project in cache
        queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      },
    }
  );
};

// Delete project mutation - using generic API utility
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useApiMutationVoid(
    (id: number) => apiClient.deleteProject(id),
    {
      successMessage: 'Project deleted successfully!',
      errorMessage: 'Failed to delete project',
      invalidateQueries: [projectKeys.lists()],
      onSuccess: (deletedId) => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      },
    }
  );
};

// Request project deletion mutation - using generic API utility
export const useRequestProjectDeletion = () => {
  const queryClient = useQueryClient();

  return useApiMutation(
    (id: number) => apiClient.requestProjectDeletion(id),
    {
      successMessage: 'Deletion request submitted successfully!',
      errorMessage: 'Failed to request project deletion',
      invalidateQueries: [projectKeys.lists()],
      onSuccess: (updatedProject) => {
        // Update the specific project in cache
        queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      },
    }
  );
};
