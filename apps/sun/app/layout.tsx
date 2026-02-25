import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Noto_Serif_SC, Noto_Sans_SC } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'

import { Providers } from './providers'
import { BaiduAnalytics } from '../components/BaiduAnalytics'

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
})

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
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
    <html className={initialColorMode} lang="zh-CN" data-theme="neutral" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='green')document.documentElement.setAttribute('data-theme','green')}catch(e){}`,
          }}
        />
      </head>
      <body className={`${notoSerifSC.variable} ${notoSansSC.variable} antialiased`}>
        <Providers initialColorMode={initialColorMode}>{children}</Providers>
        <Suspense fallback={null}>
          <BaiduAnalytics />
        </Suspense>
      </body>
    </html>
  )
}

