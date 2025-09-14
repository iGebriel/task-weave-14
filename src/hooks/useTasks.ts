import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TasksQueryParams,
  TaskExportParams,
} from '@/types/api';
import { useApiPaginatedQuery, useApiMutation, useApiMutationVoid } from './useApiQuery';
import { toast } from 'sonner';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params: TasksQueryParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  exports: () => [...taskKeys.all, 'export'] as const,
  export: (projectId: number, params: TaskExportParams) => [...taskKeys.exports(), projectId, params] as const,
};

// Get all tasks with optional filters - using generic API utility
export const useTasks = (params: TasksQueryParams = {}) => {
  console.log('useTasks hook called with params:', params);

  return useApiPaginatedQuery(
    taskKeys.list(params),
    (queryParams) => {
      console.log('Calling apiClient.getTasks with params:', queryParams);
      return apiClient.getTasks(queryParams);
    },
    params
  );
};

// Get single task
export const useTask = (id: number) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getTask(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch task');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Create task mutation - using generic API utility
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useApiMutation(
    (data: CreateTaskRequest) => apiClient.createTask(data),
    {
      successMessage: 'Task created successfully!',
      errorMessage: 'Failed to create task',
      invalidateQueries: [taskKeys.lists()],
      onSuccess: (newTask) => {
        // Add the new task to the cache
        queryClient.setQueryData(taskKeys.detail(newTask.id), newTask);
      },
    }
  );
};

// Update task mutation - using generic API utility
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, data }: { id: number; data: UpdateTaskRequest }) => apiClient.updateTask(id, data),
    {
      successMessage: 'Task updated successfully!',
      errorMessage: 'Failed to update task',
      invalidateQueries: [taskKeys.lists()],
      onSuccess: (updatedTask) => {
        // Update the specific task in cache
        queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      },
    }
  );
};

// Delete task mutation - using generic API utility
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useApiMutationVoid(
    (id: number) => apiClient.deleteTask(id),
    {
      successMessage: 'Task deleted successfully!',
      errorMessage: 'Failed to delete task',
      invalidateQueries: [taskKeys.lists()],
      onSuccess: (deletedId) => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      },
    }
  );
};

// Export project tasks
export const useExportProjectTasks = () => {
  return useMutation({
    mutationFn: async ({ projectId, params }: { projectId: number; params?: TaskExportParams }) => {
      return await apiClient.exportProjectTasks(projectId, params);
    },
    onSuccess: (data, variables) => {
      if (variables.params?.format !== 'csv') {
        toast.success('Tasks exported successfully!');
      } else {
        toast.success('CSV file downloaded successfully!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export tasks');
    },
  });
};