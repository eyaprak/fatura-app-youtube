// Tarih formatı
export function formatTarih(tarih: string | Date): string {
  const date = typeof tarih === "string" ? new Date(tarih) : tarih;
  return date.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Para formatı
export function formatPara(tutar: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(tutar);
}

// Dosya boyutu formatı
export function formatDosyaBoyutu(boyut: number): string {
  const birimler = ["B", "KB", "MB", "GB"];
  let index = 0;
  let size = boyut;

  while (size >= 1024 && index < birimler.length - 1) {
    size /= 1024;
    index++;
  }

  return `${size.toFixed(index > 0 ? 2 : 0)} ${birimler[index]}`;
}

// String'i URL-safe slug'a çevir
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Debounce fonksiyonu
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
