import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectsQueryParams,
} from '@/types/api';
import { toast } from 'sonner';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectsQueryParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// Get all projects with optional filters
export const useProjects = (params: ProjectsQueryParams = {}) => {
  console.log('🚀 useProjects hook called with params:', params);
  
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      console.log('📞 Calling apiClient.getProjects with params:', params);
      try {
        const response = await apiClient.getProjects(params);
        console.log('✅ getProjects response:', response);
        
        if (!response.success || !response.data) {
          console.error('❌ Invalid response structure:', response);
          throw new Error(response.message || 'Failed to fetch projects');
        }
        
        console.log('🎉 Returning projects data:', response.data);
        return response.data;
      } catch (error) {
        console.error('💥 useProjects queryFn error:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error) => {
      console.error('🔥 useProjects onError:', error);
    },
    onSuccess: (data) => {
      console.log('🌟 useProjects onSuccess:', data);
    },
  });
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

// Create project mutation
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectRequest) => {
      const response = await apiClient.createProject(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create project');
      }
      return response.data;
    },
    onSuccess: (newProject) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      // Add the new project to the cache
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
      
      toast.success('Project created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });
};

// Update project mutation
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProjectRequest }) => {
      const response = await apiClient.updateProject(id, data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update project');
      }
      return response.data;
    },
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      
      // Invalidate projects lists to ensure they're updated
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Project updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update project');
    },
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.deleteProject(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete project');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(deletedId) });
      
      // Invalidate projects lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Project deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });
};

// Request project deletion mutation
export const useRequestProjectDeletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.requestProjectDeletion(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to request project deletion');
      }
      return response.data;
    },
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      
      // Invalidate projects lists
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      
      toast.success('Deletion request submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to request project deletion');
    },
  });
};
