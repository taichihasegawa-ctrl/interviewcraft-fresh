import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'InterviewCraft 新卒版 | AI就活対策サービス',
  description: '文系大学生向けAI就活対策。自己分析・ES添削・面接対策をAIがサポート。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-NJJMRJ9E98" strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-NJJMRJ9E98');
        `}</Script>
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
