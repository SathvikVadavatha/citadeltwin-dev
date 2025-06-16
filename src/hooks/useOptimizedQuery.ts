
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PerformanceOptimizer } from '@/utils/performance/performanceOptimizer';

export interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn' | 'queryKey'> {
  queryFn: () => Promise<T>;
  queryKey: string;
  cacheTime?: number;
  enableOptimization?: boolean;
}

export const useOptimizedQuery = <T>(
  options: OptimizedQueryOptions<T>
) => {
  const {
    queryKey,
    queryFn,
    cacheTime = 300000,
    enableOptimization = true,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: [queryKey],
    queryFn: enableOptimization 
      ? () => PerformanceOptimizer.optimizeQuery(queryKey, queryFn, cacheTime)
      : queryFn,
    staleTime: cacheTime * 0.8, // 80% of cache time
    gcTime: cacheTime, // Updated from cacheTime to gcTime for newer @tanstack/react-query
    refetchOnWindowFocus: false,
    ...queryOptions
  });
};
