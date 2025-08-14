"use client";

import { useSWRConfig } from "swr";
import { useCallback } from "react";
import type {
  FislerQueryParams,
  PaginatedResponse,
  Fis,
  Statistics,
} from "@/lib/api";

// Cache key patterns ve types
export type CacheKeyType =
  | ["fisler", FislerQueryParams]
  | "statistics"
  | string;

// Cache key pattern matchers
export const CACHE_KEYS = {
  // Fiş listesi cache key'leri
  FISLER: "fisler",
  FISLER_PATTERN: /^fisler:/,

  // İstatistik cache key'i
  STATISTICS: "statistics",

  // Global pattern - tüm cache
  ALL: /.*/,
} as const;

// Cache key utility fonksiyonları
export const createFislerKey = (
  params: FislerQueryParams = {}
): ["fisler", FislerQueryParams] => {
  return ["fisler", params];
};

export const createStatisticsKey = (): "statistics" => {
  return "statistics";
};

// Global cache management hook
export function useCacheManager() {
  const { mutate } = useSWRConfig();

  // Fiş listesi cache'ini invalidate et
  const invalidateFisler = useCallback(
    async (specificParams?: FislerQueryParams) => {
      if (specificParams) {
        // Belirli parametreler için cache'i invalidate et
        const key = createFislerKey(specificParams);
        await mutate(key);
      } else {
        // Tüm fiş listesi cache'ini invalidate et
        await mutate(
          (key) => Array.isArray(key) && key[0] === CACHE_KEYS.FISLER,
          undefined,
          { revalidate: true }
        );
      }
    },
    [mutate]
  );

  // İstatistik cache'ini invalidate et
  const invalidateStatistics = useCallback(async () => {
    await mutate(CACHE_KEYS.STATISTICS);
  }, [mutate]);

  // Tüm cache'i invalidate et
  const invalidateAll = useCallback(async () => {
    await mutate(
      () => true, // Tüm cache key'leri
      undefined,
      { revalidate: true }
    );
  }, [mutate]);

  // Fiş listesi için global mutate fonksiyonu
  const mutateFisler = useCallback(
    async (
      params: FislerQueryParams = {},
      data?: PaginatedResponse<Fis>,
      shouldRevalidate = true
    ) => {
      const key = createFislerKey(params);
      return await mutate(key, data, { revalidate: shouldRevalidate });
    },
    [mutate]
  );

  // İstatistik için global mutate fonksiyonu
  const mutateStatistics = useCallback(
    async (data?: Statistics, shouldRevalidate = true) => {
      return await mutate(CACHE_KEYS.STATISTICS, data, {
        revalidate: shouldRevalidate,
      });
    },
    [mutate]
  );

  // Upload sonrası otomatik invalidation
  const handleUploadSuccess = useCallback(async () => {
    // Yeni fiş eklendiği için hem liste hem istatistikleri invalidate et
    await Promise.all([invalidateFisler(), invalidateStatistics()]);
  }, [invalidateFisler, invalidateStatistics]);

  // Fiş güncelleme sonrası invalidation
  const handleFisUpdate = useCallback(
    async (fisId: string) => {
      // İlgili fiş ve istatistikleri invalidate et
      await Promise.all([
        invalidateFisler(),
        invalidateStatistics(),
        // Tek fiş detayı varsa onu da invalidate et
        mutate(`fis-${fisId}`),
      ]);
    },
    [invalidateFisler, invalidateStatistics, mutate]
  );

  // Fiş silme sonrası invalidation
  const handleFisDelete = useCallback(
    async (fisId: string) => {
      // Tüm ilgili cache'leri invalidate et
      await Promise.all([
        invalidateFisler(),
        invalidateStatistics(),
        mutate(`fis-${fisId}`, undefined, { revalidate: false }), // Silindiği için revalidate etme
      ]);
    },
    [invalidateFisler, invalidateStatistics, mutate]
  );

  // Cache'in mevcut durumunu kontrol et
  const getCacheStats = useCallback(() => {
    // Bu fonksiyon development/debugging için cache durumunu gösterir
    const cache = mutate as { cache?: Map<string, unknown> };
    return {
      size: cache.cache?.size || 0,
      keys: cache.cache ? Array.from(cache.cache.keys()) : [],
    };
  }, [mutate]);

  return {
    // Cache invalidation
    invalidateFisler,
    invalidateStatistics,
    invalidateAll,

    // Direct mutation
    mutateFisler,
    mutateStatistics,

    // Event handlers
    handleUploadSuccess,
    handleFisUpdate,
    handleFisDelete,

    // Utilities
    getCacheStats,
  };
}

// Pre-configured cache manager hooks for specific use cases

// Upload bileşenleri için hook
export function useUploadCacheManager() {
  const { handleUploadSuccess } = useCacheManager();

  return {
    onUploadSuccess: handleUploadSuccess,
  };
}

// CRUD işlemleri için hook
export function useFisCacheManager() {
  const { handleFisUpdate, handleFisDelete, invalidateFisler, mutateFisler } =
    useCacheManager();

  return {
    onFisUpdate: handleFisUpdate,
    onFisDelete: handleFisDelete,
    invalidateFisler,
    mutateFisler,
  };
}

// Dashboard için hook
export function useDashboardCacheManager() {
  const { invalidateStatistics, mutateStatistics, invalidateAll } =
    useCacheManager();

  return {
    refreshStats: invalidateStatistics,
    updateStats: mutateStatistics,
    refreshAll: invalidateAll,
  };
}

// Global utility fonksiyonları (hook dışında kullanım için)
export const cacheUtils = {
  // Cache key oluşturucular
  createFislerKey,
  createStatisticsKey,

  // Pattern matchers
  isFislerKey: (key: unknown): key is ["fisler", FislerQueryParams] => {
    return (
      Array.isArray(key) && key.length === 2 && key[0] === CACHE_KEYS.FISLER
    );
  },

  isStatisticsKey: (key: unknown): key is "statistics" => {
    return key === CACHE_KEYS.STATISTICS;
  },

  // Cache key string representations (debugging için)
  serializeKey: (key: CacheKeyType): string => {
    if (typeof key === "string") {
      return key;
    }
    if (Array.isArray(key)) {
      return `${key[0]}:${JSON.stringify(key[1])}`;
    }
    return String(key);
  },
};

// TypeScript type guards
export function isFislerCacheKey(
  key: unknown
): key is ["fisler", FislerQueryParams] {
  return cacheUtils.isFislerKey(key);
}

export function isStatisticsCacheKey(key: unknown): key is "statistics" {
  return cacheUtils.isStatisticsKey(key);
}
