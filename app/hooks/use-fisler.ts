"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getFisler,
  type FislerQueryParams,
  type PaginatedResponse,
  type Fis,
} from "@/lib/api";
import { createFislerKey } from "@/lib/swr-utils";

// Hook için gerçek URL-based fetcher fonksiyonu
const fislerFetcher = async (
  params: FislerQueryParams
): Promise<PaginatedResponse<Fis>> => {
  const response = await getFisler(params);

  if (!response.success || !response.data) {
    throw new Error(response.error || "Fiş listesi yüklenirken hata oluştu");
  }

  return response.data;
};

// Filter state type
export interface FislerFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  fisNo: string;
}

// Sort configuration
export interface SortConfig {
  sortBy: "created_at" | "updated_at" | "tarih_saat" | "total";
  sortOrder: "asc" | "desc";
}

// Hook return type
export interface UseFislerReturn {
  // Data
  data: Fis[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;

  // Loading states
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;

  // Pagination
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;

  // Sorting
  sortBy: SortConfig["sortBy"];
  sortOrder: SortConfig["sortOrder"];
  setSortBy: (sortBy: SortConfig["sortBy"]) => void;
  setSortOrder: (sortOrder: SortConfig["sortOrder"]) => void;
  toggleSortOrder: () => void;
  sortByField: (field: SortConfig["sortBy"]) => void;

  // Filtering
  filters: FislerFilters;
  setFilters: (filters: Partial<FislerFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;

  // Actions
  refresh: () => Promise<PaginatedResponse<Fis> | undefined>;
  mutate: (
    data?: PaginatedResponse<Fis>
  ) => Promise<PaginatedResponse<Fis> | undefined>;
}

const defaultFilters: FislerFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  fisNo: "",
};

export function useFisler(
  initialPage = 1,
  initialLimit = 20,
  initialSort: SortConfig = { sortBy: "created_at", sortOrder: "desc" },
  enabled = true // New parameter to enable/disable the hook
): UseFislerReturn {
  // State management
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [sortBy, setSortByState] = useState<SortConfig["sortBy"]>(
    initialSort.sortBy
  );
  const [sortOrder, setSortOrderState] = useState<SortConfig["sortOrder"]>(
    initialSort.sortOrder
  );
  const [filters, setFiltersState] = useState<FislerFilters>(defaultFilters);

  // SWR için key ve params oluştur
  const swrKey = useMemo(() => {
    const params: FislerQueryParams = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.minAmount) params.minAmount = parseFloat(filters.minAmount);
    if (filters.maxAmount) params.maxAmount = parseFloat(filters.maxAmount);
    if (filters.fisNo.trim()) params.fisNo = filters.fisNo.trim();

    return createFislerKey(params);
  }, [page, limit, sortBy, sortOrder, filters]);

  // SWR hook
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? swrKey : null,
    enabled ? ([, params]) => fislerFetcher(params) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryInterval: 5000,
      errorRetryCount: 3,
      keepPreviousData: true,
    }
  );

  // Pagination helpers
  const setPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
        setPageState(newPage);
      }
    },
    [data?.totalPages]
  );

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1); // Reset to first page when changing limit
  }, []);

  const goToNextPage = useCallback(() => {
    if (data?.hasNextPage) {
      setPage(page + 1);
    }
  }, [data?.hasNextPage, page, setPage]);

  const goToPrevPage = useCallback(() => {
    if (data?.hasPrevPage) {
      setPage(page - 1);
    }
  }, [data?.hasPrevPage, page, setPage]);

  const goToFirstPage = useCallback(() => setPage(1), [setPage]);
  const goToLastPage = useCallback(
    () => setPage(data?.totalPages || 1),
    [data?.totalPages, setPage]
  );

  // Sorting helpers
  const setSortBy = useCallback((newSortBy: SortConfig["sortBy"]) => {
    setSortByState(newSortBy);
    setPageState(1); // Reset to first page when changing sort
  }, []);

  const setSortOrder = useCallback((newSortOrder: SortConfig["sortOrder"]) => {
    setSortOrderState(newSortOrder);
    setPageState(1);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  }, [sortOrder, setSortOrder]);

  const sortByField = useCallback(
    (field: SortConfig["sortBy"]) => {
      if (sortBy === field) {
        toggleSortOrder();
      } else {
        setSortBy(field);
        setSortOrder("desc");
      }
    },
    [sortBy, toggleSortOrder, setSortBy, setSortOrder]
  );

  // Filtering helpers
  const setFilters = useCallback((newFilters: Partial<FislerFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    setPageState(1); // Reset to first page when changing filters
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setPageState(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value.trim() !== "");
  }, [filters]);

  // Refresh function
  const refresh = useCallback(() => mutate(), [mutate]);

  // Reset page when data structure changes significantly
  useEffect(() => {
    if (data && page > data.totalPages && data.totalPages > 0) {
      setPageState(data.totalPages);
    }
  }, [data, page]);

  return {
    // Data
    data: data?.data || [],
    totalCount: data?.count || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || page,
    hasNextPage: data?.hasNextPage || false,
    hasPrevPage: data?.hasPrevPage || false,

    // Loading states
    isLoading,
    isValidating,
    error,

    // Pagination
    page,
    limit,
    setPage,
    setLimit,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,

    // Sorting
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    sortByField,

    // Filtering
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,

    // Actions
    refresh,
    mutate,
  };
}
