import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter } from 'next/font/google'
import './globals.css'

import { Providers } from './providers'

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
  const initialColorMode =
    cookieStore.get('chakra-ui-color-mode')?.value === 'dark' ? 'dark' : 'light'

  return (
    <html className={initialColorMode} lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers initialColorMode={initialColorMode}>{children}</Providers>
      </body>
    </html>
  )
}

