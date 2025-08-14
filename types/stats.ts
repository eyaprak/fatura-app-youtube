import { LucideIcon } from "lucide-react";
import { ListChecks, Coins, Percent, CalendarClock, Gauge } from "lucide-react";

export type FormatType = "number" | "currency" | "percentage";

export interface StatItem {
  id: string;
  title: string;
  value: number;
  icon: LucideIcon;
  formatType: FormatType;
  iconBgColor?: string;
}

// Sayı formatlama fonksiyonları
export const formatNumber = (value: number): string => {
  return value.toLocaleString("tr-TR");
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `%${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
};

export const formatStatValue = (
  value: number,
  formatType: FormatType
): string => {
  switch (formatType) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return formatPercentage(value);
    case "number":
    default:
      return formatNumber(value);
  }
};

// Beş istatistik için sabit veri yapısı template'i
export const createStatsTemplate = (data: {
  totalRecords: number;
  totalAmount: number;
  todayRecords: number;
  averageAmount: number;
  averageDailyRecords: number;
}): StatItem[] => [
  {
    id: "total-records",
    title: "Toplam Kayıt",
    value: data.totalRecords,
    icon: ListChecks,
    formatType: "number",
    iconBgColor: "bg-blue-50",
  },
  {
    id: "total-amount",
    title: "Toplam Tutar",
    value: data.totalAmount,
    icon: Coins,
    formatType: "currency",
    iconBgColor: "bg-green-50",
  },
  {
    id: "average-daily-records",
    title: "Günlük Ortalama",
    value: data.averageDailyRecords,
    icon: Percent,
    formatType: "number",
    iconBgColor: "bg-orange-50",
  },
  {
    id: "today-records",
    title: "Bugünkü Kayıtlar",
    value: data.todayRecords,
    icon: CalendarClock,
    formatType: "number",
    iconBgColor: "bg-purple-50",
  },
  {
    id: "average-amount",
    title: "Ortalama Tutar",
    value: data.averageAmount,
    icon: Gauge,
    formatType: "currency",
    iconBgColor: "bg-indigo-50",
  },
];
