
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PerformanceOptimizer } from '@/utils/performance/performanceOptimizer';

export interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryFn: () => Promise<T>;
  cacheTime?: number;
  enableOptimization?: boolean;
}

export const useOptimizedQuery = <T>(
  queryKey: string,
  options: OptimizedQueryOptions<T>
) => {
  const {
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
    cacheTime: cacheTime,
    refetchOnWindowFocus: false,
    ...queryOptions
  });
};
