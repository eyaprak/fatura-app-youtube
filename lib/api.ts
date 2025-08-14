import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type Fis = Database["public"]["Tables"]["fisler"]["Row"];
export type FisInsert = Database["public"]["Tables"]["fisler"]["Insert"];
export type FisUpdate = Database["public"]["Tables"]["fisler"]["Update"];

// Supabase client instance
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fiş listesi sorgu parametreleri
export interface FislerQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "updated_at" | "tarih_saat" | "total";
  sortOrder?: "asc" | "desc";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  fisNo?: string;
}

// Sayfalama response tipi
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Fiş listesini çeker - sayfalama, filtreleme ve arama desteği ile
 */
export async function getFisler(
  params: FislerQueryParams = {}
): Promise<ApiResponse<PaginatedResponse<Fis>>> {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc",
      search,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      fisNo,
    } = params;

    // Offset hesapla
    const offset = (page - 1) * limit;

    // Base query oluştur
    let query = supabase.from("fisler").select("*", { count: "exact" });

    // Arama filtresi - sadece fiş no arama (basit ve güvenli)
    if (search) {
      // Önce fiş no'da ara
      query = query.ilike("fis_no", `%${search}%`);
    }

    // Fiş no filtresi
    if (fisNo) {
      query = query.ilike("fis_no", `%${fisNo}%`);
    }

    // Tarih aralığı filtresi
    if (dateFrom) {
      query = query.gte("tarih_saat", dateFrom);
    }
    if (dateTo) {
      query = query.lte("tarih_saat", dateTo);
    }

    // Tutar aralığı filtresi
    if (minAmount) {
      query = query.gte("total", minAmount);
    }
    if (maxAmount) {
      query = query.lte("total", maxAmount);
    }

    // Sıralama ve sayfalama
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      data: {
        data: data || [],
        count: count || 0,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
      success: false,
    };
  }
}

/**
 * ID'ye göre tek fiş getirir
 */
export async function getFisById(id: string): Promise<ApiResponse<Fis>> {
  try {
    const { data, error } = await supabase
      .from("fisler")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
      success: false,
    };
  }
}

/**
 * Yeni fiş ekler
 */
export async function createFis(fis: FisInsert): Promise<ApiResponse<Fis>> {
  try {
    const { data, error } = await supabase
      .from("fisler")
      .insert(fis)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
      success: false,
    };
  }
}

/**
 * Fiş günceller
 */
export async function updateFis(
  id: string,
  updates: FisUpdate
): Promise<ApiResponse<Fis>> {
  try {
    const { data, error } = await supabase
      .from("fisler")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
      success: false,
    };
  }
}

/**
 * Fiş siler
 */
export async function deleteFis(id: string): Promise<ApiResponse<boolean>> {
  try {
    const { error } = await supabase.from("fisler").delete().eq("id", id);

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: true,
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
      success: false,
    };
  }
}

/**
 * İstatistik verilerini getirir
 */
export interface Statistics {
  totalRecords: number;
  totalAmount: number;
  todayRecords: number;
  averageAmount: number;
  averageDailyRecords: number;
}

export async function getStatistics(): Promise<ApiResponse<Statistics>> {
  try {
    // Toplam kayıt sayısı ve toplam tutar
    const { data: totals, error: totalsError } = await supabase
      .from("fisler")
      .select("total");

    if (totalsError) {
      return {
        data: null,
        error: totalsError.message,
        success: false,
      };
    }

    // Bugünkü kayıtlar
    const today = new Date().toISOString().split("T")[0];
    const { data: todayData, error: todayError } = await supabase
      .from("fisler")
      .select("id")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lte("created_at", `${today}T23:59:59.999Z`);

    if (todayError) {
      return {
        data: null,
        error: todayError.message,
        success: false,
      };
    }

    const totalRecords = totals?.length || 0;
    const totalAmount =
      totals?.reduce((sum, record) => sum + (record.total || 0), 0) || 0;
    const todayRecords = todayData?.length || 0;
    const averageAmount = totalRecords > 0 ? totalAmount / totalRecords : 0;

    // 30 günlük ortalama için kayıt sayısı
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentData, error: recentError } = await supabase
      .from("fisler")
      .select("id")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (recentError) {
      return {
        data: null,
        error: recentError.message,
        success: false,
      };
    }

    const recentRecords = recentData?.length || 0;
    const averageDailyRecords = recentRecords / 30;

    return {
      data: {
        totalRecords,
        totalAmount,
        todayRecords,
        averageAmount,
        averageDailyRecords,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Bilinmeyen hata",
      success: false,
    };
  }
}

export { supabase };
