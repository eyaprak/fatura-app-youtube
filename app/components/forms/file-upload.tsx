'use client'

import React, { useState, useRef, useCallback } from 'react'
import { ImagePlus, X, Upload } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { useUploadCacheManager } from '@/lib/swr-utils'

interface FileUploadProps {
    onFileSelect?: (file: File | null) => void
    onUploadSuccess: () => Promise<void>
    onUploadComplete?: (success: boolean, message?: string) => void
    disabled?: boolean
    className?: string
}

type UploadState = 'idle' | 'dragover' | 'uploading' | 'success' | 'error'

export default function FileUpload({
    onFileSelect,
    onUploadComplete,
    disabled = false,
    className
}: FileUploadProps) {
    const [uploadState, setUploadState] = useState<UploadState>('idle')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Cache invalidation hook
    const { onUploadSuccess } = useUploadCacheManager()

    // Dosya validasyonu
    const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
        const maxSize = 10 * 1024 * 1024 // 10MB

        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Sadece JPG, JPEG ve PNG dosyaları desteklenir.' }
        }

        if (file.size > maxSize) {
            return { valid: false, error: 'Dosya boyutu 10MB\'dan küçük olmalıdır.' }
        }

        return { valid: true }
    }, [])

    // Dosya seçme işlemi
    const handleFileSelect = useCallback((file: File) => {
        const validation = validateFile(file)

        if (!validation.valid) {
            setErrorMessage(validation.error || 'Geçersiz dosya')
            setUploadState('error')
            return
        }

        setSelectedFile(file)
        setErrorMessage('')
        setUploadState('idle')
        onFileSelect?.(file)
    }, [validateFile, onFileSelect])

    // Drag & Drop olayları
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) {
            setUploadState('dragover')
        }
    }, [disabled])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) {
            setUploadState('idle')
        }
    }, [disabled])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (disabled) return

        setUploadState('idle')

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            handleFileSelect(files[0])
        }
    }, [disabled, handleFileSelect])

    // Input değişim olayı
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            handleFileSelect(files[0])
        }

        // Input'u temizle ki aynı dosya seçildiğinde tekrar tetiklesin
        e.target.value = ''
    }, [handleFileSelect])

    // Dosya seçici açma
    const openFileDialog = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!disabled && fileInputRef.current && (uploadState === 'idle' || uploadState === 'error')) {
            fileInputRef.current.click()
        }
    }, [disabled, uploadState])

    // Klavye desteği
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openFileDialog()
        }
    }, [openFileDialog])

    // Yükleme işlemi (gerçek API entegrasyonu)
    const handleUpload = useCallback(async () => {
        if (!selectedFile) return

        setUploadState('uploading')
        setUploadProgress(0)
        setErrorMessage('')

        // AbortController oluştur
        abortControllerRef.current = new AbortController()

        try {
            // FormData oluştur
            const formData = new FormData()
            formData.append('file', selectedFile)

            // Upload progress tracking
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev
                    return prev + Math.random() * 10
                })
            }, 100)

            // API'ye gönder
            const response = await fetch('/api/upload-file', {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current.signal
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen hata' }))
                throw new Error(errorData.message || 'Upload başarısız')
            }

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.message || 'Upload başarısız')
            }

            setUploadState('success')

            // Cache invalidation - fiş listesi ve istatistikleri yenile
            await onUploadSuccess()

            onUploadComplete?.(true, 'Dosya başarıyla yüklendi!')

            // Reset after success
            setTimeout(() => {
                setSelectedFile(null)
                setUploadState('idle')
                setUploadProgress(0)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }, 2000)

        } catch (error) {
            setUploadState('error')
            setErrorMessage(error instanceof Error ? error.message : 'Yükleme başarısız')
            onUploadComplete?.(false, error instanceof Error ? error.message : 'Yükleme başarısız')
        } finally {
            abortControllerRef.current = null
        }
    }, [selectedFile, onUploadComplete, onUploadSuccess])

    // Yükleme iptal etme
    const handleCancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setUploadState('idle')
        setUploadProgress(0)
    }, [])

    // Reset
    const handleReset = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation()
        }

        setSelectedFile(null)
        setUploadState('idle')
        setUploadProgress(0)
        setErrorMessage('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [])

    return (
        <div className={cn("w-full", className)}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Dropzone */}
            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label="Fiş veya fatura görseli yükle"
                className={cn(
                    "border-2 border-dashed rounded-2xl bg-white p-8 text-center transition-all duration-200 min-h-[220px] flex flex-col justify-center items-center shadow-sm",
                    {
                        "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50": uploadState === 'idle' && !disabled && !selectedFile,
                        "border-blue-400 bg-blue-50": uploadState === 'dragover',
                        "border-green-300 bg-green-50": uploadState === 'success',
                        "border-red-300 bg-red-50": uploadState === 'error',
                        "opacity-50 cursor-not-allowed": disabled,
                        "cursor-pointer": !disabled && uploadState === 'idle' && !selectedFile
                    }
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={(e) => {
                    // Sadece dosya seçilmemişse ve upload durumu idle ise
                    if (uploadState === 'idle' && !selectedFile) {
                        openFileDialog(e)
                    }
                }}
                onKeyDown={handleKeyDown}
            >
                {/* İkonlar ve durumlar */}
                <div className="flex flex-col items-center space-y-4">
                    {uploadState === 'uploading' ? (
                        <>
                            <Upload className="w-12 h-12 text-blue-500 animate-pulse" />
                            <div className="w-full max-w-xs">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                    <span>Yükleniyor...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelUpload}
                                    className="mt-3"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    İptal
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <ImagePlus className={cn(
                                "w-12 h-12",
                                {
                                    "text-gray-400": uploadState === 'idle',
                                    "text-blue-500": uploadState === 'dragover',
                                    "text-green-500": uploadState === 'success',
                                    "text-red-500": uploadState === 'error'
                                }
                            )} />

                            <div className="space-y-2">
                                <p className={cn(
                                    "text-lg font-medium",
                                    {
                                        "text-gray-700": uploadState === 'idle',
                                        "text-blue-700": uploadState === 'dragover',
                                        "text-green-700": uploadState === 'success',
                                        "text-red-700": uploadState === 'error'
                                    }
                                )}>
                                    {uploadState === 'idle' && 'Fiş veya fatura görseli yükleyin'}
                                    {uploadState === 'dragover' && 'Dosyayı buraya bırakın'}
                                    {uploadState === 'success' && 'Başarıyla yüklendi!'}
                                    {uploadState === 'error' && 'Yükleme başarısız oldu'}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {uploadState === 'idle' && 'Sürükleyip bırakın veya dosya seçin'}
                                    {uploadState === 'dragover' && 'JPG, JPEG, PNG (Max 10MB)'}
                                    {uploadState === 'success' && 'Dosya işlenmeye hazır'}
                                    {uploadState === 'error' && (
                                        <span className="text-red-600 font-medium">
                                            {errorMessage || 'Tekrar deneyin veya farklı dosya seçin'}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {selectedFile && uploadState === 'idle' && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full max-w-xs">
                                    <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleUpload()
                                            }}
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2"
                                        >
                                            📤 Yükle
                                        </Button>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleReset()
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Error state - Tekrar deneme butonu */}
                            {uploadState === 'error' && (
                                <div className="mt-4 flex flex-col items-center space-y-3">
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                // Mevcut dosyayı koru ve tekrar dene
                                                if (selectedFile) {
                                                    handleUpload()
                                                } else {
                                                    // Dosya yoksa yeni dosya seç
                                                    openFileDialog(e)
                                                }
                                            }}
                                            size="sm"
                                            className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2"
                                        >
                                            🔄 Tekrar Dene
                                        </Button>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                // Önce durumu sıfırla, sonra dosya seç
                                                setUploadState('idle')
                                                setErrorMessage('')
                                                openFileDialog(e)
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                                        >
                                            📁 Farklı Dosya Seç
                                        </Button>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleReset(e)
                                            }}
                                            size="sm"
                                            variant="outline"
                                            className="border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {selectedFile && (
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600">Mevcut dosya: {selectedFile.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {uploadState === 'idle' && !selectedFile && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openFileDialog(e)
                                    }}
                                    disabled={disabled}
                                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 text-base"
                                    size="lg"
                                >
                                    📁 Dosya Seç
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
