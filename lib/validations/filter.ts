import { z } from "zod";

// Base filter schema - form inputs
export const filterFormSchema = z
  .object({
    // Tarih aralığı
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),

    // Fiş numarası arama
    fisNo: z.string().optional().or(z.literal("")),

    // Tutar aralığı - string inputs
    minAmount: z.string().optional().or(z.literal("")),
    maxAmount: z.string().optional().or(z.literal("")),

    // Genel arama (fiş no, ürün adı, açıklama)
    search: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Tarih validasyonu: başlangıç tarihi bitiş tarihinden büyük olamaz
      if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return startDate <= endDate;
      }
      return true;
    },
    {
      message: "Başlangıç tarihi bitiş tarihinden büyük olamaz",
      path: ["startDate"],
    }
  )
  .refine(
    (data) => {
      // Tutar validasyonu: min tutar max tutardan büyük olamaz
      if (data.minAmount && data.maxAmount) {
        const minAmount = parseFloat(data.minAmount);
        const maxAmount = parseFloat(data.maxAmount);
        if (!isNaN(minAmount) && !isNaN(maxAmount)) {
          return minAmount <= maxAmount;
        }
      }
      return true;
    },
    {
      message: "Minimum tutar maximum tutardan büyük olamaz",
      path: ["minAmount"],
    }
  );

// TypeScript tipi schema'dan çıkarılır
export type FilterFormData = z.infer<typeof filterFormSchema>;

// Filtre form default değerleri
export const defaultFilterValues: FilterFormData = {
  startDate: "",
  endDate: "",
  fisNo: "",
  minAmount: "",
  maxAmount: "",
  search: "",
};

// API query params'a dönüştürme utility
export interface FilterQueryParams {
  dateFrom?: string;
  dateTo?: string;
  fisNo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export const transformFilterToQuery = (
  data: FilterFormData
): FilterQueryParams => {
  const query: FilterQueryParams = {};

  if (data.startDate && data.startDate.trim()) {
    query.dateFrom = data.startDate;
  }

  if (data.endDate && data.endDate.trim()) {
    query.dateTo = data.endDate;
  }

  if (data.fisNo && data.fisNo.trim()) {
    query.fisNo = data.fisNo.trim();
  }

  if (data.minAmount && data.minAmount.trim()) {
    const minAmount = parseFloat(data.minAmount);
    if (!isNaN(minAmount)) {
      query.minAmount = minAmount;
    }
  }

  if (data.maxAmount && data.maxAmount.trim()) {
    const maxAmount = parseFloat(data.maxAmount);
    if (!isNaN(maxAmount)) {
      query.maxAmount = maxAmount;
    }
  }

  if (data.search && data.search.trim()) {
    query.search = data.search.trim();
  }

  return query;
};

// Query params'tan form data'ya dönüştürme utility
export const transformQueryToFilter = (
  query: FilterQueryParams
): FilterFormData => {
  return {
    startDate: query.dateFrom || "",
    endDate: query.dateTo || "",
    fisNo: query.fisNo || "",
    minAmount: query.minAmount?.toString() || "",
    maxAmount: query.maxAmount?.toString() || "",
    search: query.search || "",
  };
};

// Form validasyonu helper fonksiyonları
export const validateDateRange = (
  startDate: string,
  endDate: string
): boolean => {
  if (!startDate || !endDate) return true;
  return new Date(startDate) <= new Date(endDate);
};

export const validateAmountRange = (
  minAmount?: number,
  maxAmount?: number
): boolean => {
  if (minAmount === undefined || maxAmount === undefined) return true;
  return minAmount <= maxAmount;
};

// Form field validation error messages
export const FILTER_VALIDATION_MESSAGES = {
  INVALID_DATE_RANGE: "Başlangıç tarihi bitiş tarihinden büyük olamaz",
  INVALID_AMOUNT_RANGE: "Minimum tutar maximum tutardan büyük olamaz",
  NEGATIVE_AMOUNT: "Tutar negatif olamaz",
  INVALID_DATE_FORMAT: "Geçersiz tarih formatı",
  INVALID_NUMBER_FORMAT: "Geçersiz sayı formatı",
} as const;

// Form field names (hook-form için)
export const FILTER_FIELD_NAMES = {
  START_DATE: "startDate",
  END_DATE: "endDate",
  FIS_NO: "fisNo",
  MIN_AMOUNT: "minAmount",
  MAX_AMOUNT: "maxAmount",
  SEARCH: "search",
} as const;

// Form reset helper
export const resetFilterForm = (): FilterFormData => ({
  ...defaultFilterValues,
});

// Form validation helper
export const isFilterFormEmpty = (data: FilterFormData): boolean => {
  return (
    !data.startDate &&
    !data.endDate &&
    !data.fisNo &&
    data.minAmount === undefined &&
    data.maxAmount === undefined &&
    !data.search
  );
};

// URL query string için utility
export const filterToUrlQuery = (data: FilterFormData): URLSearchParams => {
  const params = new URLSearchParams();
  const query = transformFilterToQuery(data);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
};

export const urlQueryToFilter = (
  searchParams: URLSearchParams
): FilterFormData => {
  const query: FilterQueryParams = {};

  const dateFrom = searchParams.get("dateFrom");
  if (dateFrom) query.dateFrom = dateFrom;

  const dateTo = searchParams.get("dateTo");
  if (dateTo) query.dateTo = dateTo;

  const fisNo = searchParams.get("fisNo");
  if (fisNo) query.fisNo = fisNo;

  const minAmount = searchParams.get("minAmount");
  if (minAmount) query.minAmount = parseFloat(minAmount);

  const maxAmount = searchParams.get("maxAmount");
  if (maxAmount) query.maxAmount = parseFloat(maxAmount);

  const search = searchParams.get("search");
  if (search) query.search = search;

  return transformQueryToFilter(query);
};
