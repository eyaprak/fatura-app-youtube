import { z } from "zod";

// Fiş validasyon şeması
export const fisSchema = z.object({
  dosya_adi: z.string().min(1, "Dosya adı gereklidir"),
  dosya_boyutu: z.number().positive("Dosya boyutu pozitif olmalıdır"),
  vergi_numarasi: z.string().optional(),
  firma_adi: z.string().optional(),
  tarih: z.string().optional(),
  toplam_tutar: z.number().positive().optional(),
  kdv_tutari: z.number().nonnegative().optional(),
  net_tutar: z.number().positive().optional(),
  fis_tipi: z.string().optional(),
  fis_numarasi: z.string().optional(),
});

// Fiş filtre validasyon şeması
export const fisFiltresiSchema = z.object({
  baslangic_tarihi: z.string().optional(),
  bitis_tarihi: z.string().optional(),
  firma_adi: z.string().optional(),
  vergi_numarasi: z.string().optional(),
  fis_tipi: z.string().optional(),
  islem_durumu: z
    .enum(["beklemede", "isleniyor", "tamamlandi", "hata"])
    .optional(),
  min_tutar: z.number().nonnegative().optional(),
  max_tutar: z.number().positive().optional(),
});

// Fiş ürün kalemi validasyon şeması
export const fisItemSchema = z.object({
  isim: z.string().min(1, "Ürün adı gereklidir"),
  miktar: z.number().positive("Miktar pozitif olmalıdır"),
  birim: z.string().optional(),
  birim_fiyat: z.number().positive("Birim fiyat pozitif olmalıdır"),
  kdv_orani: z.number().nonnegative("KDV oranı negatif olamaz"),
  kdv_tutari: z.number().nonnegative("KDV tutarı negatif olamaz"),
  toplam_tutar: z.number().positive("Toplam tutar pozitif olmalıdır"),
});

// Dosya yükleme validasyon şeması
export const dosyaYuklemeSchema = z.object({
  file: z
    .instanceof(File, { message: "Geçerli bir dosya seçiniz" })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "Dosya boyutu 10MB'dan küçük olmalıdır"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(
          file.type
        ),
      "Sadece JPEG, PNG veya PDF dosyaları kabul edilir"
    ),
});

export type FisFormData = z.infer<typeof fisSchema>;
export type FisFiltresiFormData = z.infer<typeof fisFiltresiSchema>;
export type FisItemFormData = z.infer<typeof fisItemSchema>;
export type DosyaYuklemeFormData = z.infer<typeof dosyaYuklemeSchema>;
