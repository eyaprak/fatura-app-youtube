'use client'

import React, { useEffect, useCallback, useRef, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Filter, Calendar, Receipt, DollarSign, Search, RotateCcw } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import {
    filterFormSchema,
    defaultFilterValues,
    type FilterFormData,
    FILTER_FIELD_NAMES,
    urlQueryToFilter,
    filterToUrlQuery
} from '@/lib/validations/filter'
import { useDebounce } from '@/app/hooks/use-debounce'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
    onFilterChange?: (filters: FilterFormData) => void
    onReset?: () => void
    className?: string
    disabled?: boolean
    syncWithUrl?: boolean  // Option to enable/disable URL sync
    debounceDelay?: number // Debounce delay in milliseconds (default: 300)
    hasActiveFilters?: boolean // External filter state to show reset button
}

export default function FilterPanel({
    onFilterChange,
    onReset,
    className,
    disabled = false,
    syncWithUrl = true,
    debounceDelay = 300,
    hasActiveFilters: externalHasActiveFilters
}: FilterPanelProps) {
    // Next.js navigation hooks
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    // State for debounce search functionality
    const [isAutoSearching, setIsAutoSearching] = useState(false)
    const isInitialLoad = useRef(true)
    const previousFormData = useRef<FilterFormData>(defaultFilterValues)

    // React Hook Form setup
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
        reset,
        watch,
        setValue
    } = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: defaultFilterValues,
        mode: 'onChange'
    })

    // Watch all form values to detect if form has changes
    const watchedValues = watch()
    const hasFormChanges = Object.values(watchedValues).some(value =>
        value !== "" && value !== undefined && value !== null
    )

    // Calculate if reset button should be enabled
    // Enable if there are form values OR external filters are active
    const shouldEnableReset = hasFormChanges || (externalHasActiveFilters === true)

    // Use external filter state if provided, otherwise use form state  
    const hasChanges = externalHasActiveFilters !== undefined
        ? (externalHasActiveFilters || hasFormChanges)
        : hasFormChanges    // Debounce the watched form values for auto-search
    const debouncedFormValues = useDebounce(watchedValues, debounceDelay)

    // Load filters from URL on component mount
    useEffect(() => {
        if (!syncWithUrl) return

        const urlFilters = urlQueryToFilter(searchParams)

        // Only update form if URL has filters
        const hasUrlFilters = Object.values(urlFilters).some(value =>
            value !== "" && value !== undefined && value !== null
        )

        if (hasUrlFilters) {
            // Set form values from URL
            Object.entries(urlFilters).forEach(([key, value]) => {
                setValue(key as keyof FilterFormData, value as string)
            })

            // Store initial values from URL
            previousFormData.current = urlFilters
        }

        // Mark initial load as complete
        isInitialLoad.current = false
    }, [searchParams, setValue, syncWithUrl])

    // Update URL when form values change (debounced)
    const updateUrl = useCallback((formData: FilterFormData) => {
        if (!syncWithUrl) return

        const params = filterToUrlQuery(formData)
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

        // Use router.replace to avoid adding to browser history for each keystroke
        router.replace(newUrl, { scroll: false })
    }, [pathname, router, syncWithUrl])

    // Auto-search effect when debounced form values change
    useEffect(() => {
        // Skip if it's the initial load or if form hasn't changed
        if (isInitialLoad.current) return

        // Check if form values actually changed
        const hasActualChanges = Object.keys(debouncedFormValues).some(key => {
            return debouncedFormValues[key as keyof FilterFormData] !==
                previousFormData.current[key as keyof FilterFormData]
        })

        if (!hasActualChanges) return

        // Set searching state
        setIsAutoSearching(true)

        // Update URL with debounced values
        updateUrl(debouncedFormValues)

        // Call the filter change callback
        onFilterChange?.(debouncedFormValues)

        // Store current values for next comparison
        previousFormData.current = { ...debouncedFormValues }

        // Clear searching state after a brief delay
        const clearSearchingTimeout = setTimeout(() => {
            setIsAutoSearching(false)
        }, 100)

        return () => clearTimeout(clearSearchingTimeout)
    }, [debouncedFormValues, onFilterChange, updateUrl])

    // Form submit handler (manual submit)
    const onSubmit: SubmitHandler<FilterFormData> = async (data) => {
        // Update URL with new filters
        updateUrl(data)

        // Call the callback with form data
        onFilterChange?.(data)

        // Update previous form data
        previousFormData.current = { ...data }
    }

    // Reset handler
    const handleReset = () => {
        // Reset form to default values
        reset(defaultFilterValues)

        // Force trigger filter change with empty values
        onFilterChange?.(defaultFilterValues)

        // Clear URL parameters
        if (syncWithUrl) {
            router.replace(pathname, { scroll: false })
        }

        // Reset previous form data
        previousFormData.current = { ...defaultFilterValues }

        // Call external reset callback
        onReset?.()
    }

    return (
        <div className={cn(
            "rounded-2xl border bg-white p-4 shadow-sm",
            className
        )}>
            {/* Accessibility: Screen reader announcements */}
            <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
                role="status"
            >
                {isAutoSearching && "Arama yapılıyor..."}
                {isSubmitting && "Form gönderiliyor..."}
            </div>

            {/* Panel Header */}
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2">
                    <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-grow">
                    <h3 className="font-medium text-gray-900">Filtrele</h3>
                    <p className="text-sm text-gray-500">
                        Fiş listesini filtreleyin
                        {isAutoSearching && (
                            <span className="ml-2 text-blue-600 text-xs">
                                • Arama yapılıyor...
                            </span>
                        )}
                    </p>
                </div>
                {/* Search indicator */}
                {isAutoSearching && (
                    <div className="flex items-center gap-1 text-blue-600">
                        <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-xs">Ara...</span>
                    </div>
                )}
            </div>

            {/* Filter Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Tarih Aralığı */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>Tarih Aralığı</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Başlangıç Tarihi */}
                        <div className="space-y-1">
                            <label
                                htmlFor={FILTER_FIELD_NAMES.START_DATE}
                                className="block text-xs font-medium text-gray-600"
                            >
                                Başlangıç Tarihi
                            </label>
                            <Input
                                id={FILTER_FIELD_NAMES.START_DATE}
                                type="date"
                                disabled={disabled}
                                className={cn(
                                    "text-sm",
                                    errors.startDate && "border-red-300 focus:border-red-500 focus:ring-red-500"
                                )}
                                aria-invalid={!!errors.startDate}
                                {...register(FILTER_FIELD_NAMES.START_DATE)}
                            />
                            {errors.startDate && (
                                <p className="text-xs text-red-600" role="alert">
                                    {errors.startDate.message}
                                </p>
                            )}
                        </div>

                        {/* Bitiş Tarihi */}
                        <div className="space-y-1">
                            <label
                                htmlFor={FILTER_FIELD_NAMES.END_DATE}
                                className="block text-xs font-medium text-gray-600"
                            >
                                Bitiş Tarihi
                            </label>
                            <Input
                                id={FILTER_FIELD_NAMES.END_DATE}
                                type="date"
                                disabled={disabled}
                                className={cn(
                                    "text-sm",
                                    errors.endDate && "border-red-300 focus:border-red-500 focus:ring-red-500"
                                )}
                                aria-invalid={!!errors.endDate}
                                {...register(FILTER_FIELD_NAMES.END_DATE)}
                            />
                            {errors.endDate && (
                                <p className="text-xs text-red-600" role="alert">
                                    {errors.endDate.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Fiş Numarası */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Receipt className="h-4 w-4" />
                        <span>Fiş Numarası</span>
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor={FILTER_FIELD_NAMES.FIS_NO}
                            className="block text-xs font-medium text-gray-600"
                        >
                            Fiş No
                        </label>
                        <Input
                            id={FILTER_FIELD_NAMES.FIS_NO}
                            type="text"
                            placeholder="Fiş numarası girin"
                            disabled={disabled}
                            className={cn(
                                "text-sm",
                                errors.fisNo && "border-red-300 focus:border-red-500 focus:ring-red-500"
                            )}
                            aria-invalid={!!errors.fisNo}
                            {...register(FILTER_FIELD_NAMES.FIS_NO)}
                        />
                        {errors.fisNo && (
                            <p className="text-xs text-red-600" role="alert">
                                {errors.fisNo.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Tutar Aralığı */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <DollarSign className="h-4 w-4" />
                        <span>Tutar Aralığı</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {/* Minimum Tutar */}
                        <div className="space-y-1">
                            <label
                                htmlFor={FILTER_FIELD_NAMES.MIN_AMOUNT}
                                className="block text-xs font-medium text-gray-600"
                            >
                                Minimum Tutar (₺)
                            </label>
                            <Input
                                id={FILTER_FIELD_NAMES.MIN_AMOUNT}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                disabled={disabled}
                                className={cn(
                                    "text-sm",
                                    errors.minAmount && "border-red-300 focus:border-red-500 focus:ring-red-500"
                                )}
                                aria-invalid={!!errors.minAmount}
                                {...register(FILTER_FIELD_NAMES.MIN_AMOUNT)}
                            />
                            {errors.minAmount && (
                                <p className="text-xs text-red-600" role="alert">
                                    {errors.minAmount.message}
                                </p>
                            )}
                        </div>

                        {/* Maximum Tutar */}
                        <div className="space-y-1">
                            <label
                                htmlFor={FILTER_FIELD_NAMES.MAX_AMOUNT}
                                className="block text-xs font-medium text-gray-600"
                            >
                                Maximum Tutar (₺)
                            </label>
                            <Input
                                id={FILTER_FIELD_NAMES.MAX_AMOUNT}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                disabled={disabled}
                                className={cn(
                                    "text-sm",
                                    errors.maxAmount && "border-red-300 focus:border-red-500 focus:ring-red-500"
                                )}
                                aria-invalid={!!errors.maxAmount}
                                {...register(FILTER_FIELD_NAMES.MAX_AMOUNT)}
                            />
                            {errors.maxAmount && (
                                <p className="text-xs text-red-600" role="alert">
                                    {errors.maxAmount.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Genel Arama */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Search className="h-4 w-4" />
                        <span>Genel Arama</span>
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor={FILTER_FIELD_NAMES.SEARCH}
                            className="block text-xs font-medium text-gray-600"
                        >
                            Arama
                        </label>
                        <Input
                            id={FILTER_FIELD_NAMES.SEARCH}
                            type="text"
                            placeholder="Fiş no, ürün adı veya açıklama arayın"
                            disabled={disabled}
                            className={cn(
                                "text-sm",
                                errors.search && "border-red-300 focus:border-red-500 focus:ring-red-500"
                            )}
                            aria-invalid={!!errors.search}
                            {...register(FILTER_FIELD_NAMES.SEARCH)}
                        />
                        {errors.search && (
                            <p className="text-xs text-red-600" role="alert">
                                {errors.search.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                    <Button
                        type="submit"
                        disabled={disabled || isSubmitting || isAutoSearching || !isValid}
                        className={cn(
                            "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
                            isAutoSearching && "bg-blue-500 cursor-wait"
                        )}
                        title={isAutoSearching ? "Otomatik arama devam ediyor..." : "Filtreleri uygula"}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Filtreleniyor...</span>
                            </div>
                        ) : isAutoSearching ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Otomatik Arama</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <Filter className="h-4 w-4" />
                                <span>Filtrele</span>
                            </div>
                        )}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        disabled={disabled || isSubmitting || !shouldEnableReset}
                        className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!shouldEnableReset ? "Temizlenecek filtre yok" : "Tüm filtreleri temizle"}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <RotateCcw className="h-4 w-4" />
                            <span>Sıfırla</span>
                        </div>
                    </Button>
                </div>

                {/* Auto-search Notice */}
                {hasChanges && !isAutoSearching && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 flex items-center gap-1">
                            <Search className="h-3 w-3" />
                            <span>
                                <strong>Otomatik Arama:</strong> Form değişiklikleri {debounceDelay}ms sonra otomatik olarak uygulanır.
                            </span>
                        </p>
                    </div>
                )}

                {/* Form Validation Errors Summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 mt-4">
                        <div className="flex items-start gap-2">
                            <div className="flex-shrink-0">
                                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                    <span className="text-red-600 text-xs font-bold">!</span>
                                </div>
                            </div>
                            <div className="flex-grow">
                                <p className="text-xs text-red-700 font-medium mb-1">
                                    Lütfen aşağıdaki hataları düzeltin:
                                </p>
                                <ul className="text-xs text-red-600 space-y-1">
                                    {Object.entries(errors).map(([field, error]) => {
                                        // Field name translations for better UX
                                        const fieldNames: Record<string, string> = {
                                            startDate: 'Başlangıç Tarihi',
                                            endDate: 'Bitiş Tarihi',
                                            fisNo: 'Fiş Numarası',
                                            minAmount: 'Minimum Tutar',
                                            maxAmount: 'Maximum Tutar',
                                            search: 'Arama'
                                        }

                                        return (
                                            <li key={field} className="flex items-start gap-1">
                                                <span className="inline-block w-1 h-1 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                                <span>
                                                    <strong>{fieldNames[field] || field}:</strong> {error?.message}
                                                </span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}
