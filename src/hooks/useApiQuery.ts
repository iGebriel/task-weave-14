import { useQuery, useMutation, useQueryClient, QueryKey, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

/**
 * Generic API query hook that eliminates DRY violations
 * by providing common error handling and response validation patterns.
 */
export const useApiQuery = <TData, TParams = void>(
  queryKey: QueryKey,
  queryFn: (params?: TParams) => Promise<ApiResponse<TData>>,
  params?: TParams,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await queryFn(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'API request failed');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    ...options,
  });
};

/**
 * Generic API query hook for paginated responses
 */
export const useApiPaginatedQuery = <TData, TParams = void>(
  queryKey: QueryKey,
  queryFn: (params?: TParams) => Promise<ApiResponse<PaginatedResponse<TData>>>,
  params?: TParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<TData>>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await queryFn(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'API request failed');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    ...options,
  });
};

/**
 * Generic API mutation hook with consistent error handling and success notifications
 */
export const useApiMutation = <TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: QueryKey[];
  } & Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn' | 'onSuccess' | 'onError'>
) => {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    invalidateQueries,
    ...mutationOptions
  } = options || {};

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'API request failed');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Show success toast
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom success handler
      onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      // Show error toast
      const message = errorMessage || error.message || 'Operation failed';
      toast.error(message);

      // Call custom error handler
      onError?.(error, variables);
    },
    ...mutationOptions,
  });
};

/**
 * Generic API mutation hook for operations that don't return data
 */
export const useApiMutationVoid = <TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<void>>,
  options?: {
    onSuccess?: (variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    successMessage?: string;
    errorMessage?: string;
    invalidateQueries?: QueryKey[];
  } & Omit<UseMutationOptions<void, Error, TVariables>, 'mutationFn' | 'onSuccess' | 'onError'>
) => {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    invalidateQueries,
    ...mutationOptions
  } = options || {};

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await mutationFn(variables);
      if (!response.success) {
        throw new Error(response.message || 'API request failed');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate specified queries
      if (invalidateQueries) {
        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Show success toast
      if (successMessage) {
        toast.success(successMessage);
      }

      // Call custom success handler
      onSuccess?.(variables);
    },
    onError: (error: Error, variables) => {
      // Show error toast
      const message = errorMessage || error.message || 'Operation failed';
      toast.error(message);

      // Call custom error handler
      onError?.(error, variables);
    },
    ...mutationOptions,
  });
};