import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Noto_Serif_SC, Noto_Sans_SC } from 'next/font/google'
import { Suspense } from 'react'
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css'
import 'lxgw-wenkai-webfont/lxgwwenkai-bold.css'
import './globals.css'

import { Providers } from './providers'
import { BaiduAnalytics } from '../components/BaiduAnalytics'

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
  preload: false,
})

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
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
    <html className={initialColorMode} lang="zh-CN" data-theme="neutral" data-font="noto-serif" data-font-size="md" data-reading-width="standard" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var a=JSON.parse(localStorage.getItem('appearance')||'{}'),d=document.documentElement;if(a.theme)d.setAttribute('data-theme',a.theme);if(a.font)d.setAttribute('data-font',a.font);if(a.fontSize)d.setAttribute('data-font-size',a.fontSize);if(a.readingWidth)d.setAttribute('data-reading-width',a.readingWidth);if(!a.theme){var t=localStorage.getItem('theme');if(t)d.setAttribute('data-theme',t)}}catch(e){}`,
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

