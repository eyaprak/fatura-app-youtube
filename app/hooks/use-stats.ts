"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { getStatistics, type Statistics } from "@/lib/api";
import { createStatisticsKey } from "@/lib/swr-utils";

// SWR fetcher fonksiyonu
const statisticsFetcher = async (): Promise<Statistics> => {
  const response = await getStatistics();

  if (!response.success || !response.data) {
    throw new Error(response.error || "İstatistikler yüklenirken hata oluştu");
  }

  return response.data;
};

// Hook return type
export interface UseStatsReturn {
  // Data
  data: Statistics | undefined;

  // Loading states
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;

  // Actions
  refresh: () => Promise<Statistics | undefined>;
  mutate: (data?: Statistics) => Promise<Statistics | undefined>;

  // Computed values
  hasData: boolean;
  isEmpty: boolean;

  // Formatted values
  formattedTotalAmount: string;
  formattedAverageAmount: string;
  totalAmountGrowth?: number;
  recordsGrowth?: number;
}

// Hook configuration
interface UseStatsConfig {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  errorRetryCount?: number;
  errorRetryInterval?: number;
}

const defaultConfig: UseStatsConfig = {
  refreshInterval: 300000, // 5 minutes
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

export function useStats(config: UseStatsConfig = {}): UseStatsReturn {
  const finalConfig = { ...defaultConfig, ...config };

  // SWR hook
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    createStatisticsKey(),
    statisticsFetcher,
    {
      refreshInterval: finalConfig.refreshInterval,
      revalidateOnFocus: finalConfig.revalidateOnFocus,
      revalidateOnReconnect: finalConfig.revalidateOnReconnect,
      errorRetryCount: finalConfig.errorRetryCount,
      errorRetryInterval: finalConfig.errorRetryInterval,
      // Background refetch when tab becomes visible
      focusThrottleInterval: 60000, // Throttle focus revalidation to once per minute
      // Dedupe requests within 10 seconds
      dedupingInterval: 10000,
    }
  );

  // Refresh function
  const refresh = useCallback(() => mutate(), [mutate]);

  // Computed values
  const hasData = Boolean(data);
  const isEmpty = hasData && data!.totalRecords === 0;

  // Formatted values
  const formattedTotalAmount = data
    ? new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
      }).format(data.totalAmount)
    : "₺0,00";

  const formattedAverageAmount = data
    ? new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
      }).format(data.averageAmount)
    : "₺0,00";

  // Growth calculations (could be enhanced with historical data)
  // For now, we can calculate some basic insights
  const totalAmountGrowth = data
    ? Math.round(
        (data.todayRecords / Math.max(data.averageDailyRecords, 1)) * 100 - 100
      )
    : undefined;

  const recordsGrowth =
    data && data.averageDailyRecords > 0
      ? Math.round((data.todayRecords / data.averageDailyRecords) * 100 - 100)
      : undefined;

  return {
    // Data
    data,

    // Loading states
    isLoading,
    isValidating,
    error,

    // Actions
    refresh,
    mutate,

    // Computed values
    hasData,
    isEmpty,

    // Formatted values
    formattedTotalAmount,
    formattedAverageAmount,
    totalAmountGrowth,
    recordsGrowth,
  };
}

// Hook variant for real-time stats (faster refresh)
export function useRealTimeStats(): UseStatsReturn {
  return useStats({
    refreshInterval: 30000, // 30 seconds
    revalidateOnFocus: true,
    errorRetryInterval: 2000,
  });
}

// Hook variant for dashboard display (balanced refresh)
export function useDashboardStats(): UseStatsReturn {
  return useStats({
    refreshInterval: 120000, // 2 minutes
    revalidateOnFocus: true,
    errorRetryCount: 5,
  });
}

// Hook variant for background stats (less frequent refresh)
export function useBackgroundStats(): UseStatsReturn {
  return useStats({
    refreshInterval: 600000, // 10 minutes
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 2,
  });
}
