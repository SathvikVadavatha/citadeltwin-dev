
import { useState, useMemo, useCallback } from 'react';

interface UsePerformantListProps<T> {
  data: T[];
  pageSize?: number;
  searchFields?: (keyof T)[];
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

export const usePerformantList = <T extends Record<string, any>>({
  data,
  pageSize = 50,
  searchFields = [],
  sortField,
  sortDirection = 'asc'
}: UsePerformantListProps<T>) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSortField, setLocalSortField] = useState<keyof T | undefined>(sortField);
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>(sortDirection);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm || searchFields.length === 0) return data;
    
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchFields]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!localSortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[localSortField];
      const bValue = b[localSortField];
      
      if (aValue < bValue) return localSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return localSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, localSortField, localSortDirection]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(0); // Reset to first page when searching
  }, []);

  const handleSort = useCallback((field: keyof T) => {
    if (localSortField === field) {
      setLocalSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLocalSortField(field);
      setLocalSortDirection('asc');
    }
    setCurrentPage(0); // Reset to first page when sorting
  }, [localSortField]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  return {
    // Data
    data: paginatedData,
    totalItems: sortedData.length,
    totalPages,
    currentPage,
    
    // Search
    searchTerm,
    handleSearch,
    
    // Sorting
    sortField: localSortField,
    sortDirection: localSortDirection,
    handleSort,
    
    // Pagination
    nextPage,
    previousPage,
    goToPage,
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,
  };
};
