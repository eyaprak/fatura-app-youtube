// PRD'ye uygun Fiş tipi
export interface Fis {
  id: string;
  fis_no: string | null;
  tarih_saat: string | null;
  created_at: string;
  updated_at: string;
  total: number | null;
  total_kdv: number | null;
  items: FisItem[] | null;
}

// Fiş içindeki ürün/hizmet kalemleri (PRD JSONB örneğine uygun)
export interface FisItem {
  name: string;
  quantity: number;
  unit_price: number;
  kdv: number;
  total: number;
}

// İstatistik verileri için tip
export interface IstatistikVeri {
  baslik: string;
  deger: string | number;
  icon: string;
  renk?: string;
  aciklama?: string;
}

// Filtre için tipler (PRD'ye uygun)
export interface FisFiltresi {
  baslangic_tarihi?: string;
  bitis_tarihi?: string;
  fis_no?: string;
  min_tutar?: number;
  max_tutar?: number;
}

// API Response tipler
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Sayfalama için tip
export interface Sayfalama {
  sayfa: number;
  limit: number;
  toplam: number;
  toplam_sayfa: number;
}

// Stats related types - yeni istatistik sistemi
export * from "./stats";
