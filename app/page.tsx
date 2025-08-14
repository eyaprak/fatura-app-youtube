'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import Header from './components/layout/header'
import FileUpload from './components/forms/file-upload'
import { StatsGrid } from './components/stats-grid'
import FilterPanel from './components/filter-panel'
import FisList from './components/fis-list'
import { useFisler } from './hooks/use-fisler'
import { useStats } from './hooks/use-stats'
import type { FilterFormData } from '@/lib/validations/filter'

export default function Home() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  // SWR hooks for data management
  const {
    data: fisler,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage,
    isLoading: fislerLoading,
    isValidating,
    error: fislerError,
    mutate: mutateFisler,
    hasActiveFilters,
    setFilters,
    clearFilters,
    goToNextPage,
    goToPrevPage
  } = useFisler()

  const {
    mutate: mutateStats,
    isLoading: statsLoading
  } = useStats()

  const isRefreshing = fislerLoading || statsLoading

  const handleFileSelect = (file: File | null) => {
    if (file) {
      console.log('Dosya seçildi:', file)
      toast.success(`${file.name} dosyası seçildi!`)
    }
  }

  const handleUploadComplete = async (success: boolean, message?: string) => {
    if (success) {
      toast.success(message || 'Dosya başarıyla yüklendi!')

      // Veri güncellemesi - SWR mutate ile cache'i yenile
      try {
        // Önce istatistikleri güncelle
        await mutateStats()
        // Sonra fiş listesini güncelle
        await mutateFisler()

        toast.success('Veriler güncellendi!')
      } catch (error) {
        console.error('Veri güncelleme hatası:', error)
        toast.error('Veriler güncellenirken hata oluştu')
      }
    } else {
      toast.error(message || 'Yükleme başarısız!')
    }
  }

  const handleFilterChange = (filters: FilterFormData) => {
    console.log('Filtreler değişti:', filters)

    // FilterFormData'yı FislerFilters formatına dönüştür
    const fislerFilters = {
      search: filters.search || '',
      dateFrom: filters.startDate || '',
      dateTo: filters.endDate || '',
      minAmount: filters.minAmount || '',
      maxAmount: filters.maxAmount || '',
      fisNo: filters.fisNo || ''
    }

    // Filtreleri useFisler hook'una ilet
    setFilters(fislerFilters)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    // Arama query'sini de filtreler arasına ekle
    setFilters({ search: query })
  }

  const handleFilterReset = () => {
    console.log('Filtreler sıfırlandı')
    setSearchQuery('')
    clearFilters()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Üst Kısım: İstatistik Kartları */}
            <section>
              <StatsGrid />
            </section>

            {/* Orta Kısım: Dosya Yükleme */}
            <section>
              <FileUpload
                onFileSelect={handleFileSelect}
                onUploadComplete={handleUploadComplete}
                onUploadSuccess={async () => {
                  await mutateStats()
                  await mutateFisler()
                }}
              />
            </section>

            {/* Alt Kısım: Filtre ve Liste Grid */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sol Sütun: Filtre Paneli (1 sütun) */}
                <div className="md:col-span-1">
                  <FilterPanel
                    onFilterChange={handleFilterChange}
                    onReset={handleFilterReset}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>

                {/* Sağ Sütun: Fiş Listesi (3 sütun) */}
                <div className="md:col-span-3">
                  <FisList
                    className=""
                    data={fisler}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    currentPage={currentPage}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                    isLoading={fislerLoading}
                    isValidating={isValidating}
                    error={fislerError}
                    onNextPage={goToNextPage}
                    onPrevPage={goToPrevPage}
                    hasActiveFilters={hasActiveFilters}
                    onClearFilters={handleFilterReset}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onFisSelect={(fis) => {
                      console.log('Fiş seçildi:', fis)
                      // Detay sayfasına yönlendirme
                      router.push(`/fis/${fis.id}`)
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Debug Bilgisi (Development ortamında) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
                <h3 className="font-medium mb-2">Debug Bilgisi:</h3>
                <ul className="space-y-1">
                  <li>• SWR Veri Yönetimi: ✅ Aktif</li>
                  <li>• Toast Sistemi: ✅ Entegre</li>
                  <li>• Yenileme Durumu: {isRefreshing ? '🔄 Yenileniyor' : '✅ Hazır'}</li>
                  <li>• Aktif Filtreler: {hasActiveFilters ? '🔍 Var' : '❌ Yok'}</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
