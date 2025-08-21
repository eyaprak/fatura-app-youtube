'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Receipt, Calendar, Package, ExternalLink, ChevronLeft, ChevronRight, FileText, AlertCircle } from 'lucide-react'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { useFisler } from '@/app/hooks/use-fisler'
import { useDebounce } from '@/app/hooks/use-debounce'
import { formatCurrency } from '@/types/stats'
import { cn } from '@/lib/utils'
import type { Fis as ApiResponse } from '@/lib/api'
import type { FisItem } from '@/types'

interface FisListProps {
    className?: string
    onFisSelect?: (fis: ApiResponse) => void
    searchQuery?: string
    onSearchChange?: (query: string) => void
    pageSize?: number
    // External data props (when data comes from parent)
    data?: ApiResponse[]
    totalCount?: number
    totalPages?: number
    currentPage?: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
    isLoading?: boolean
    isValidating?: boolean
    error?: Error | null
    onNextPage?: () => void
    onPrevPage?: () => void
    hasActiveFilters?: boolean
    onClearFilters?: () => void
}

// Fiş kartı bileşeni
interface FisCardProps {
    fis: ApiResponse
    onSelect?: () => void
}

function FisCard({ fis, onSelect }: FisCardProps) {
    // Items alanını güvenli bir şekilde parse et
    const parseItems = (items: unknown): FisItem[] => {
        if (!items) return []
        if (Array.isArray(items)) return items
        if (typeof items === 'string') {
            try {
                const parsed = JSON.parse(items)
                return Array.isArray(parsed) ? parsed : []
            } catch {
                return []
            }
        }
        return []
    }

    const itemCount = parseItems(fis.items).length
    const fisNo = fis.fis_no || 'N/A'
    const total = fis.total || 0
    const tarihSaat = fis.tarih_saat
        ? new Date(fis.tarih_saat).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Tarih belirtilmemiş'

    return (
        <div className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
            {/* Üst satır: Fiş No ve Tutar */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-50 p-2">
                        <Receipt className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">
                        Fiş #{fisNo}
                    </span>
                </div>
                <div className="text-right">
                    <div className="font-semibold text-gray-900">
                        {formatCurrency(total)}
                    </div>
                </div>
            </div>

            {/* Alt satır: Tarih-saat, Ürün sayısı, Detay butonu */}
            <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{tarihSaat}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{itemCount} ürün</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        onSelect?.()
                    }}
                    className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Detay Gör
                </Button>
            </div>
        </div>
    )
}

// Loading skeleton bileşeni
function FisCardSkeleton() {
    return (
        <div className="rounded-xl border bg-white p-4 animate-pulse">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-gray-200 w-8 h-8"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
        </div>
    )
}

// Boş durum bileşeni
function EmptyState({ hasFilters, onClearFilters }: { hasFilters: boolean, onClearFilters?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasFilters ? 'Fiş bulunamadı' : 'Henüz fiş yok'}
            </h3>
            <p className="text-gray-500 text-center max-w-sm mb-4">
                {hasFilters
                    ? 'Arama kriterlerinize uygun fiş bulunamadı. Farklı kriterler deneyebilirsiniz.'
                    : 'Henüz sisteme fiş eklenmemiş. İlk fişinizi yükleyerek başlayabilirsiniz.'
                }
            </p>
            {hasFilters && (
                <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="text-sm"
                >
                    Filtreleri Temizle
                </Button>
            )}
        </div>
    )
}

// Hata durum bileşeni
function ErrorState({ error, onRetry }: { error: Error, onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="rounded-full bg-red-100 p-6 mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                Veriler yüklenirken hata oluştu
            </h3>
            <p className="text-gray-500 text-center max-w-sm mb-4">
                {error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'}
            </p>
            <Button onClick={onRetry} className="text-sm">
                Tekrar Dene
            </Button>
        </div>
    )
}

export default function FisList({
    className,
    onFisSelect,
    searchQuery: externalSearchQuery,
    onSearchChange: externalOnSearchChange,
    pageSize = 20,
    // External data props
    data: externalData,
    totalCount: externalTotalCount,
    totalPages: externalTotalPages,
    currentPage: externalCurrentPage,
    hasNextPage: externalHasNextPage,
    hasPrevPage: externalHasPrevPage,
    isLoading: externalIsLoading,
    isValidating: externalIsValidating,
    error: externalError,
    onNextPage: externalOnNextPage,
    onPrevPage: externalOnPrevPage,
    hasActiveFilters: externalHasActiveFilters,
    onClearFilters: externalOnClearFilters
}: FisListProps) {
    // Internal search state (used when external search not provided)
    const [internalSearchQuery, setInternalSearchQuery] = useState('')

    // Determine which search state to use
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery
    const setSearchQuery = externalOnSearchChange || setInternalSearchQuery

    // Debounce search query
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    // Use external data if provided, otherwise use internal hook
    const useExternalData = externalData !== undefined

    // Fiş listesi hook'u (only when external data not provided)
    const hookData = useFisler(1, pageSize, undefined, !useExternalData)
    const { setFilters } = hookData

    // Determine which data source to use
    const fisler = useExternalData ? externalData : hookData.data
    const totalCount = useExternalData ? (externalTotalCount || 0) : hookData.totalCount
    const totalPages = useExternalData ? (externalTotalPages || 0) : hookData.totalPages
    const currentPage = useExternalData ? (externalCurrentPage || 1) : hookData.currentPage
    const hasNextPage = useExternalData ? (externalHasNextPage || false) : hookData.hasNextPage
    const hasPrevPage = useExternalData ? (externalHasPrevPage || false) : hookData.hasPrevPage
    const isLoading = useExternalData ? (externalIsLoading || false) : hookData.isLoading
    const isValidating = useExternalData ? (externalIsValidating || false) : hookData.isValidating
    const error = useExternalData ? externalError : hookData.error
    const hasActiveFilters = useExternalData ? (externalHasActiveFilters || false) : hookData.hasActiveFilters

    // Search effect - update filters when debounced search changes (only for internal hook)
    useEffect(() => {
        if (!useExternalData && setFilters) {
            setFilters({ search: debouncedSearchQuery })
        }
    }, [debouncedSearchQuery, useExternalData, setFilters])

    // Search input change handler
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchQuery(value)

        // If using external data, trigger external search change immediately
        if (useExternalData && externalOnSearchChange) {
            externalOnSearchChange(value)
        }
    }, [setSearchQuery, useExternalData, externalOnSearchChange])

    // Pagination handlers
    const handlePrevPage = () => {
        if (useExternalData) {
            externalOnPrevPage?.()
        } else {
            hookData.goToPrevPage()
        }
    }

    const handleNextPage = () => {
        if (useExternalData) {
            externalOnNextPage?.()
        } else {
            hookData.goToNextPage()
        }
    }

    // Clear filters handler
    const handleClearFilters = () => {
        if (useExternalData) {
            externalOnClearFilters?.()
        } else {
            hookData.clearFilters()
            setSearchQuery('')
        }
    }

    // Fiş selection handler
    const handleFisSelect = (fis: ApiResponse) => {
        onFisSelect?.(fis)
    }

    return (
        <div className={cn("rounded-2xl border bg-white shadow-sm", className)}>
            {/* Header with search */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-50 p-2">
                            <Receipt className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Fiş Listesi</h3>
                            <p className="text-sm text-gray-500">
                                {isLoading ? 'Yükleniyor...' : `${totalCount} fiş`}
                                {isValidating && !isLoading && (
                                    <span className="ml-2 text-blue-600">• Güncelleniyor...</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Fiş ara..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 pr-4 py-2 w-full border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isLoading}
                    />
                    {debouncedSearchQuery !== searchQuery && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Error State */}
                {error && (
                    <ErrorState
                        error={error}
                        onRetry={useExternalData ? () => window.location.reload() : hookData.refresh}
                    />
                )}

                {/* Loading State */}
                {isLoading && !error && (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <FisCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && fisler.length === 0 && (
                    <EmptyState
                        hasFilters={hasActiveFilters || searchQuery.trim() !== ''}
                        onClearFilters={handleClearFilters}
                    />
                )}

                {/* Fiş Listesi */}
                {!isLoading && !error && fisler.length > 0 && (
                    <>
                        <div className="space-y-4 mb-6">
                            {fisler.map((fis) => (
                                <FisCard
                                    key={fis.id}
                                    fis={fis}
                                    onSelect={() => handleFisSelect(fis)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="text-sm text-gray-500">
                                    Sayfa {currentPage} / {totalPages} (Toplam {totalCount} kayıt)
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrevPage}
                                        disabled={!hasPrevPage || isValidating}
                                        className="flex items-center gap-1"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Önceki
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNextPage}
                                        disabled={!hasNextPage || isValidating}
                                        className="flex items-center gap-1"
                                    >
                                        Sonraki
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
