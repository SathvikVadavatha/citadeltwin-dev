
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { QueryOptimizer } from '@/utils/performance/queryOptimizer';
import { ErrorHandler } from '@/utils/errorHandling';

export interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn' | 'queryKey'> {
  queryFn: () => Promise<T>;
  queryKey: string;
  cacheTime?: number;
  enableOptimization?: boolean;
  errorContext?: string;
  showUserError?: boolean;
}

export const useOptimizedQuery = <T>(
  options: OptimizedQueryOptions<T>
) => {
  const {
    queryKey,
    queryFn,
    cacheTime = 300000,
    enableOptimization = true,
    errorContext = 'Data fetch',
    showUserError = true,
    ...queryOptions
  } = options;

  const wrappedQueryFn = async (): Promise<T> => {
    try {
      if (enableOptimization) {
        return await QueryOptimizer.optimizeQuery(queryKey, queryFn, cacheTime);
      } else {
        return await queryFn();
      }
    } catch (error) {
      ErrorHandler.handleAsyncError(error, errorContext, showUserError);
      throw error;
    }
  };

  return useQuery({
    queryKey: [queryKey],
    queryFn: wrappedQueryFn,
    staleTime: cacheTime * 0.8,
    gcTime: cacheTime,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors or client errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions
  });
};
