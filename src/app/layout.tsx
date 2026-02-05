import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Asset Insights | 專業資產追蹤',
  description: '現代化、私密的個人資產管理專家，搭載 AI 財務分析建議。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Asset Insights',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        {/* 使用用戶指定的 Favicon */}
        <link rel="icon" href="/favicon.ico?favicon.7ed73651.ico" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-white bg-[#F8FAFC]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
