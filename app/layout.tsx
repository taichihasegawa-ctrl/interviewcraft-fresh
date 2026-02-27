import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'InterviewCraft Fresh | 話すだけでES・面接対策が完成する',
  description: '元採用担当AIコーチが、あなたの強みを引き出します。自己分析・ES作成・面接対策をAIがサポート。',
  openGraph: {
    title: '話すだけでES・面接対策が完成する | InterviewCraft Fresh',
    description: '元採用担当AIコーチが、あなたの強みを引き出します。自己分析・ES作成・面接対策をAIがサポート。',
    images: [{ url: '/ogp.png', width: 1200, height: 630 }],
    type: 'website',
    siteName: 'InterviewCraft Fresh',
  },
  twitter: {
    card: 'summary_large_image',
    title: '話すだけでES・面接対策が完成する',
    description: '元採用担当AIコーチが、あなたの強みを引き出します。',
    images: ['/ogp.png'],
  },
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
