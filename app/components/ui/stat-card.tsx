import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconBgColor?: string;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    iconBgColor = "bg-slate-50"
}: StatCardProps) {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]">
            <div className="flex items-center space-x-3">
                {/* Icon Badge */}
                <div className={`w-9 h-9 rounded-full p-2 ${iconBgColor} flex items-center justify-center`}>
                    <Icon
                        size={20}
                        className="text-slate-600"
                        aria-label={`${title} icon`}
                    />
                </div>

                {/* Content */}
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <p className="text-xl font-semibold text-slate-900 font-mono tabular-nums">
                        {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
                    </p>
                </div>
            </div>
        </div>
    );
}
