import { useState, useEffect, useMemo } from 'react';

interface UsePaginationResult<T> {
  currentPage: number;
  totalPages: number;
  paginatedData: T[];
  setCurrentPage: (page: number) => void;
  startEntry: number;
  endEntry: number;
  totalEntries: number;
}

export function usePagination<T>(data: T[], pageSize: number): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [data.length, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  const paginatedData = useMemo(
    () => data.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [data, currentPage, pageSize]
  );

  const startEntry = data.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, data.length);

  return {
    currentPage,
    totalPages,
    paginatedData,
    setCurrentPage,
    startEntry,
    endEntry,
    totalEntries: data.length,
  };
}
