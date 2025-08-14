'use client';

import { StatCard } from '@/app/components/ui';
import { StatItem, formatStatValue, createStatsTemplate } from '@/types/stats';
import { useDashboardStats } from '@/app/hooks/use-stats';
import { Statistics } from '@/lib/api';

interface StatsGridProps {
    // Optional prop to override hook behavior (for testing)
    data?: Statistics;
    isLoading?: boolean;
}

// Loading skeleton bileşeni
function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse">
            <div className="flex items-center space-x-3">
                {/* Icon skeleton */}
                <div className="w-9 h-9 rounded-full bg-slate-200"></div>

                {/* Content skeleton */}
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
            </div>
        </div>
    );
}

// Error state bileşeni
function StatsError({ error }: { error: string }) {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                            İstatistik verileri yüklenirken hata oluştu
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function StatsGrid({ data: propData, isLoading: propIsLoading }: StatsGridProps) {
    // Gerçek API'den veri çek (prop olarak geçilmediyse)
    const { data: hookData, isLoading: hookIsLoading, error } = useDashboardStats();

    // Prop'tan gelen veri varsa onu kullan, yoksa hook'tan gelen veriyi kullan
    const data = propData || hookData;
    const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;

    // Hata durumu
    if (error && !propData) {
        return <StatsError error={error?.message || 'Bilinmeyen hata oluştu'} />;
    }

    // Loading durumu
    if (isLoading || !data) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <StatCardSkeleton key={index} />
                    ))}
                </div>
            </div>
        );
    }

    // Create stats items from template
    const statsItems: StatItem[] = createStatsTemplate(data);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {statsItems.map((stat) => (
                    <StatCard
                        key={stat.id}
                        title={stat.title}
                        value={formatStatValue(stat.value, stat.formatType)}
                        icon={stat.icon}
                        iconBgColor={stat.iconBgColor}
                    />
                ))}
            </div>
        </div>
    );
}
