'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getFisById, type Fis } from '@/lib/api'
import { FisItem } from '@/types'
import { Button } from '@/app/components/ui'
import { ArrowLeft, FileText, Receipt, Calendar, Clock, DollarSign, Info } from '@/app/components/ui/icons'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default function FisDetailPage({ params }: PageProps) {
    const router = useRouter()
    const resolvedParams = use(params)
    const [fis, setFis] = useState<Fis | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Helper function to parse items from JSON
    const parseItems = (items: unknown): FisItem[] => {
        if (!items) return []
        if (Array.isArray(items)) {
            return items.filter(item =>
                item &&
                typeof item === 'object' &&
                'name' in item &&
                'quantity' in item &&
                'unit_price' in item &&
                'kdv' in item &&
                'total' in item
            ) as FisItem[]
        }
        return []
    }

    useEffect(() => {
        const fetchFis = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await getFisById(resolvedParams.id)

                if (!response.success || !response.data) {
                    setError(response.error || 'Fiş bulunamadı')
                    return
                }

                setFis(response.data)
            } catch (err) {
                console.error('Error fetching fis:', err)
                setError('Fiş yüklenirken bir hata oluştu')
                toast.error('Fiş yüklenirken bir hata oluştu')
            } finally {
                setLoading(false)
            }
        }

        if (resolvedParams.id) {
            fetchFis()
        }
    }, [resolvedParams.id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center min-h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Fiş yükleniyor...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !fis) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Geri Dön
                        </Button>
                    </div>

                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-12 h-12 text-red-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {error || 'Fiş bulunamadı'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Aradığınız fiş bulunamadı veya erişim izniniz bulunmuyor.
                        </p>
                        <Button onClick={() => router.push('/')}>
                            Ana Sayfaya Dön
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb Navigation */}
                <div className="mb-6">
                    <nav className="flex items-center space-x-2 text-sm text-gray-500">
                        <button
                            onClick={() => router.push('/')}
                            className="hover:text-gray-700 transition-colors"
                        >
                            Ana Sayfa
                        </button>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">
                            Fiş Detayı #{fis.fis_no || resolvedParams.id}
                        </span>
                    </nav>
                </div>

                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri Dön
                    </Button>
                </div>

                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Receipt className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Fiş Detayı
                            </h1>
                            <p className="text-gray-600">
                                {fis.fis_no ? `Fiş No: ${fis.fis_no}` : `ID: ${resolvedParams.id}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Receipt className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {fis.fis_no ? `Fiş No: ${fis.fis_no}` : `Fiş ID: ${resolvedParams.id}`}
                                </h2>
                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {fis.tarih_saat
                                            ? new Date(fis.tarih_saat).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : new Date(fis.created_at).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                        {fis.total && (
                            <div className="text-right">
                                <p className="text-sm text-gray-500 mb-1">Toplam Tutar</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₺{fis.total.toFixed(2)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Information Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Info className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Temel Bilgiler</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-gray-500">ID:</span>
                                <p className="text-gray-900">{fis.id}</p>
                            </div>
                            {fis.fis_no && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Fiş No:</span>
                                    <p className="text-gray-900">{fis.fis_no}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Date Information Card */}
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Tarih Bilgileri</h3>
                        </div>
                        <div className="space-y-3">
                            {fis.tarih_saat && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Fiş Tarihi:</span>
                                    <p className="text-gray-900">
                                        {new Date(fis.tarih_saat).toLocaleString('tr-TR')}
                                    </p>
                                </div>
                            )}
                            <div>
                                <span className="text-sm font-medium text-gray-500">Oluşturulma:</span>
                                <p className="text-gray-900">
                                    {new Date(fis.created_at).toLocaleString('tr-TR')}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Güncellenme:</span>
                                <p className="text-gray-900">
                                    {new Date(fis.updated_at).toLocaleString('tr-TR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Information Card */}
                    <div className="bg-green-50 border-green-200 rounded-lg border shadow-sm p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Mali Bilgiler</h3>
                        </div>
                        <div className="space-y-3">
                            {fis.total && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Toplam Tutar:</span>
                                    <p className="text-gray-900 font-semibold">₺{fis.total.toFixed(2)}</p>
                                </div>
                            )}
                            {fis.total_kdv && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Toplam KDV:</span>
                                    <p className="text-gray-900">₺{fis.total_kdv.toFixed(2)}</p>
                                </div>
                            )}
                            {fis.total && fis.total_kdv && (
                                <div>
                                    <span className="text-sm font-medium text-gray-500">KDV Hariç:</span>
                                    <p className="text-gray-900">₺{(fis.total - fis.total_kdv).toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                {fis.items && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Ürün Detayları</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ürün Adı
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Miktar
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Birim Fiyat
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            KDV (%)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Toplam
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(() => {
                                        const items = parseItems(fis.items)
                                        return items.length > 0 ? (
                                            items.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {item.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Intl.NumberFormat('tr-TR', {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 2
                                                        }).format(item.quantity)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Intl.NumberFormat('tr-TR', {
                                                            style: 'currency',
                                                            currency: 'TRY'
                                                        }).format(item.unit_price)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Intl.NumberFormat('tr-TR', {
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 1
                                                        }).format(item.kdv)}%
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {new Intl.NumberFormat('tr-TR', {
                                                            style: 'currency',
                                                            currency: 'TRY'
                                                        }).format(item.total)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    Ürün bilgisi bulunamadı
                                                </td>
                                            </tr>
                                        )
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Summary Section */}
                <div className="bg-gray-50 rounded-lg p-4 mt-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        {/* Left side - Last updated */}
                        <div>
                            <p className="text-sm text-gray-600">
                                Son güncelleme: {new Date(fis.updated_at).toLocaleString('tr-TR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        {/* Right side - Summary totals */}
                        <div className="text-right">
                            {(() => {
                                const items = parseItems(fis.items)
                                return (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            Toplam {items.length} ürün
                                        </p>
                                        {fis.total && (
                                            <p className="text-lg font-bold text-gray-900">
                                                Genel Toplam: {new Intl.NumberFormat('tr-TR', {
                                                    style: 'currency',
                                                    currency: 'TRY'
                                                }).format(fis.total)}
                                            </p>
                                        )}
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
