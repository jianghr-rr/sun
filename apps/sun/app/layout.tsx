import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'

import { Providers } from './providers'
import { BaiduAnalytics } from '../components/BaiduAnalytics'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Sun',
  description: 'A clean Next.js starter',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const initialColorMode: 'dark' = 'dark'

  return (
    <html className={initialColorMode} lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers initialColorMode={initialColorMode}>{children}</Providers>
        {/* 百度统计 - 需要 Suspense 包裹因为使用了 useSearchParams */}
        <Suspense fallback={null}>
          <BaiduAnalytics />
        </Suspense>
      </body>
    </html>
  )
}

