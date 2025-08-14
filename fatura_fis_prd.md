# 📘 Fatura/Fiş Dashboard ve Otomasyon PRD

## 🎯 Amaç

Kullanıcıların fiş/fatura görsellerini yükleyerek bu belgelerden **otomatik veri çıkarımı** yapılması, **Supabase veritabanına kaydedilmesi** ve modern bir dashboard arayüzü üzerinden kayıtların listelenip detaylarının görüntülenmesini sağlayan bir sistem.

Backend otomasyonu **n8n workflow** ile yürütülecek, OCR ve veri işleme için **Mistral OCR** ve **Information Extractor** kullanılacak, gerektiğinde **Google Gemini** destekli doğal dil işleme entegrasyonu sağlanacak.

---

## ⚙️ Kullanılan Teknolojiler

- **Frontend:** Next.js 15, Tailwind CSS
- **Backend:** Next.js API Routes
- **Veritabanı:** Supabase
- **Bildirim:** react-hot-toast
- **Otomasyon:** n8n Webhook & Workflow (Data Extract İşlemleri)
- **İkonlar:** Heroicons veya Lucide Icons (Tailwind ile uyumlu)

---

## 🗺️ Genel Akış

1. Kullanıcı **tek bir** fiş/fatura görseli yükler.
2. Next.js API Route aracılığıyla **n8n webhook**'una POST edilir.
3. n8n workflow adımları:
   - Mistral Upload Node ile görsel yüklenir.
   - Mistral Signed URL Node ile geçici erişim URL'si alınır.
   - Mistral DOC OCR Node ile OCR işlemi yapılır.
   - Information Extractor Node ile OCR metni JSON şemasına dönüştürülür.
   - Supabase'te fis_no mevcutsa güncelleme, yoksa yeni kayıt ekleme yapılır.
4. Webhook çıktısı `{ "upload": "success" }` olarak döner.
5. Frontend toast ile sonuç bildirimi yapar.
6. Anasayfadaki liste otomatik güncellenir.

---

## 🎨 Tasarım Spesifikasyonu (Detaylı)

### 1) Tasarım Sistemi (Design Tokens)

- **Renk Paleti (Tailwind):**
  - **Primary:** blue-600 `#2563eb` / hover: blue-700 / focus ring: blue-300
  - **Accent (Success):** green-500, **Warning:** amber-500, **Danger:** rose-500
  - **Yüzeyler:** white, slate-50, **Border:** gray-200, **Metin:** slate-900 / slate-600
  - **Karanlık Mod (ops.):** slate-900 bg, slate-100 text, border-slate-700
- **Spacing:** 4, 6, 8, 12, 16, 20, 24, 32 (Tailwind birimleri: `p-4`, `gap-6` vb.)
- **Radius:** kartlar `rounded-2xl`, inputlar `rounded-lg`, butonlar `rounded-xl`
- **Gölge:** kartlar `shadow-sm` (hover: `shadow-md`), üst bar `shadow-sm`
- **Tipografi:**
  - Başlıklar: `text-2xl font-semibold` (sayfa başlığı), kart başlığı: `text-sm font-medium`
  - Rakamlar: `tabular-nums` (istatistik kartları ve tutarlar için)
- **İkon Seti:** **Lucide** (önerilen) veya **Heroicons**.
  - **Toplam Kayıt:** `ListChecks`
  - **Toplam Tutar:** `Coins`
  - **Toplam KDV:** `Percent`
  - **Bugünkü Kayıtlar:** `CalendarClock`
  - **Ortalama Tutar:** `Gauge`

### 2) Layout Kuralları

- **Sayfa Konteyneri:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Grid:**
  - İstatistik kartları: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4`
  - İçerik alanı: `grid grid-cols-1 md:grid-cols-4 gap-6`
- **Breakpoints:** sm=640px, md=768px, lg=1024px, xl=1280px

### 3) Anasayfa Bileşenleri

**3.1 Header (Üst Bar)**

- Yükseklik: 64px, arka plan: `bg-white`, gölge: `shadow-sm`, padding: `py-4 px-8`
- Sol: Logo (metinsel: **FY**), Sağ: "Ana Sayfa" linki
- Klavye odak stilleri: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300`

**3.2 İstatistik Kartları (5 adet)**

- Kart: `rounded-2xl border border-gray-200 bg-white p-4 shadow-sm`
- İç yapı: solda ikon rozeti (36x36, `rounded-full p-2 bg-slate-50`), sağda başlık + değer
- Değer metni: `text-2xl font-semibold tabular-nums`
- Hover: `shadow-md translate-y-[1px]`

**3.3 Yükleme Bileşeni (Dropzone)**

- Kutu: `w-full max-w-xl mx-auto border-2 border-dashed border-gray-300 rounded-2xl bg-white p-8 text-center`
- Yükseklik: min 220px; ikon olarak `ImagePlus`
- Desteklenen türler: **JPG, JPEG, PNG**, max **10MB**
- **Durumlar:**
  - _Idle:_ açıklama metni + buton `Dosya Seç`
  - _Drag-over:_ kenarlık `border-blue-400 bg-blue-50`
  - _Uploading:_ yüzde ilerleme çubuğu (`h-2 rounded bg-blue-600`) + iptal butonu
  - _Success:_ `react-hot-toast` ile "Yükleme başarılı"
  - _Error:_ `Alert` bileşeni (kırmızı şerit, hata mesajı)
- **Erişilebilirlik:** dropzone `role="button"`, `aria-label="Fiş veya fatura görseli yükle"`, klavye ile Enter/Space yükleme tetikler

**3.4 Filtre Paneli (Sol Sütun)**

- Kart: `rounded-2xl border bg-white p-4`
- Alanlar: Tarih Aralığı (Başlangıç/Bitiş), Fiş No, Min/Max Tutar
- Butonlar: **Filtrele** (`btn-primary`), **Sıfırla** (`btn-ghost`)
- Form doğrulama: tarih aralığı geçerliyse etkin; `aria-invalid` kullanımını ekle

**3.5 Liste (Sağ Sütun)**

- Üst: Arama inputu (`placeholder="Fiş no / ürün adı / açıklama"`), `Debounce 300ms`
- Liste: kart satırları `rounded-xl border p-4 bg-white hover:shadow-md`
  - Üst satır: **Fiş #0001** (sol), **Tutar: 10,42 TL** (sağ, `font-semibold`)
  - Alt satır: tarih-saat, `N ürün`, **Detay Gör** butonu (sağ)
- **Sayfalama:** 20 kayıt/sayfa, alt kısımda `Prev/Next` butonları (SWR ile sonsuz kaydırma opsiyonel)
- **Boş Durum:** illüstrasyon + "Henüz kayıt yok. İlk fişini yükle."
- **Skeleton:** 5 satır gri blok (`animate-pulse`)

### 4) Detay Sayfası

**4.1 Üst Kısım**

- Breadcrumb: "Ana Sayfa / Kayıt Detayı"
- Header Kart: `bg-white border rounded-2xl p-6` — başlık: **Fiş #0001**, alt başlık: `5 Ağustos 2025 17:30`

**4.2 Bilgi Kartları (3'lü)**

- Grid: `grid grid-cols-1 md:grid-cols-3 gap-4`
- Kart içerikleri:
  1. **Fiş Bilgileri:** Fiş No
  2. **Tarih Bilgileri:** Fiş Tarihi, Oluşturulma
  3. **Toplam Bilgiler:** Tutar, KDV, Ürün Sayısı (arka plan `bg-green-500 text-white`, `rounded-2xl`)

**4.3 Ürün Tablosu**

- Sütunlar: Ürün Adı / Miktar / Birim Fiyat / KDV / Toplam
- Stil: başlık satırı `bg-slate-50 font-medium`, satırlar `border-b`
- Mobil: tablo `overflow-x-auto`

**4.4 Alt Özet**

- Sol: "Son güncellenme: …"
- Sağ: "Toplam Ürün: … / Genel Toplam: …"

### 5) Durumlar & Geri Bildirim

- **Toast Mesajları:**
  - Başarı: "Yükleme başarılı. Kayıt eklendi/güncellendi."
  - Hata: "Yükleme başarısız. Lütfen tekrar deneyin."
- **Form Hataları:** input altında açıklayıcı metin, `aria-describedby` bağla
- **Boş/Loading/Error:** tüm ana alanlar için ayrı boş durum, skeleton ve hata bileşeni

### 6) Erişilebilirlik (A11y)

- Her input için `label` ve `id` bağla; `aria-invalid` ve hata mesajı referansı
- Klavye tuşları: Tab sırası mantıklı; Esc ile modal/işlem iptal
- Renk kontrastları WCAG AA (en az 4.5:1) — buton/metin kontrol edilecek

### 7) Yerelleştirme ve Formatlama

- **Görüntüleme (UI):** `tr-TR` — para birimi: `₺` ve ondalık **virgül** (ör. `10,42 TL`)
- **Veritabanı/İşleme:** sayısal alanlarda **nokta** ondalık (ör. `10.42`)
- Tarih-saat görüntüsü: `5 Ağustos 2025 17:30` (date-fns `tr` locale)

### 8) Performans ve Durum Yönetimi

- Liste için **SWR** + önbellek; yeniden doğrulama: webhook sonrası `mutate`
- Görsel yükleme sırasında `AbortController` ile iptal desteği
- Varlık boyutu: tek sayfa \~<250KB JS hedefi; ikonlar **tree-shakeable** kütüphaneden

### 9) Tasarım Teslimatları (Figma/Whimsical)

- **Wireframe (LF):** Anasayfa, Detay, Yükleme durumları (idle/drag/uploading/success/error)
- **High-Fidelity:** Renkler, ikonlar, spacing; karanlık mod varyantı
- **Component Library:** Button, Input, Select, Card, Badge, Alert, Toast, Table, Pagination, Empty, Skeleton, Dropzone
- **Spec Notları:** ölçüler, padding, grid, responsive kırılımlar, ikon isimleri

---

## 🗃️ Supabase Veritabanı Tasarımı

\`\`\*\* tablosu\*\*

| Alan       | Tip       | Açıklama                |
| ---------- | --------- | ----------------------- |
| id         | UUID (PK) | Benzersiz ID            |
| fis_no     | TEXT      | Fiş numarası            |
| tarih_saat | TIMESTAMP | Fiş tarihi              |
| created_at | TIMESTAMP | Kayıt oluşturma zamanı  |
| updated_at | TIMESTAMP | Kayıt güncelleme zamanı |
| total      | NUMERIC   | Toplam tutar            |
| total_kdv  | NUMERIC   | Toplam KDV              |
| items      | JSONB     | Ürün detayları          |

\`\`\*\* JSONB örneği:\*\*

```json
[
  {
    "name": "YUMURTA",
    "quantity": 10,
    "unit_price": 0.5,
    "kdv": 0.37,
    "total": 5.74
  },
  {
    "name": "EKMEK",
    "quantity": 5,
    "unit_price": 1.0,
    "kdv": 0.05,
    "total": 5.1
  }
]
```

---

## 🛠 Workflow Teknik Detaylar (n8n)

- **Webhook Node:** Frontend'den dosya alır.
- **Mistral Upload Node:** Dosyayı Mistral OCR servisine yükler.
- **Mistral Signed URL Node:** Geçici erişim URL'si alır.
- **Mistral DOC OCR Node:** OCR işlemi yapar.
- **Information Extractor Node:** OCR çıktısını JSON formatına dönüştürür.
- **Supabase Get/If/Create/Update:** Kayıt kontrolü, ekleme veya güncelleme.
- **Respond to Webhook Node:** Frontend'e yanıt döner.

---

## 📌 Kurallar ve Kısıtlamalar

- Tek görsel yüklenebilir.
- Görsel kaydedilmez, yalnızca veriler saklanır.
- Webhook yanıtı `{ "upload": "success" }` ise toast ile başarı mesajı gösterilir.
- Veriler client-side fetch ile çekilmelidir (SWR vb.).
- OCR sonucu tarih formatı `YYYY/MM/DD HH:mm`, fiyatlarda nokta (`.`) kullanılmalı, KDV tutar olarak belirtilmelidir.
