'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
    children: ReactNode
}

// SWR için varsayılan fetcher fonksiyonu
const fetcher = async (url: string) => {
    const res = await fetch(url)

    if (!res.ok) {
        const error = new Error('Veri çekme hatası')
        // @ts-expect-error - Error objesine custom property ekleniyor
        error.info = await res.json()
        // @ts-expect-error - Error objesine custom property ekleniyor
        error.status = res.status
        throw error
    }

    return res.json()
}

export function SWRProvider({ children }: SWRProviderProps) {
    return (
        <SWRConfig
            value={{
                fetcher,
                // Cache'i 5 dakika boyunca tut
                dedupingInterval: 300000,
                // Hata durumunda 3 kez yeniden dene
                errorRetryCount: 3,
                // Yeniden deneme aralığı (ms)
                errorRetryInterval: 1000,
                // Tab'a odaklandığında yeniden çek
                revalidateOnFocus: true,
                // Ağ bağlantısı geri geldiğinde yeniden çek
                revalidateOnReconnect: true,
                // Sayfa yüklendiğinde cache'den göster
                revalidateOnMount: true,
                // Background'da otomatik yenileme süresi (5 dakika)
                refreshInterval: 300000,
                // İstek timeout süresi (30 saniye)
                loadingTimeout: 30000,
                // Global hata handler
                onError: (error) => {
                    console.error('SWR Error:', error)
                },
                // Loading durumlarında fallback
                fallback: {}
            }}
        >
            {children}
        </SWRConfig>
    )
}
