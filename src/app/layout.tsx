import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Capoo Wealth | 咖波財富小助手',
  description: '咖波幫你嗅嗅行情，囤積肉肉資產！最可愛的個人資產追蹤專家。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Capoo Wealth',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#6CB7E6',
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
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;800;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico?favicon.7ed73651.ico" />
      </head>
      <body className="font-body antialiased selection:bg-primary/30 bg-[#F0F9FF] selection:text-primary">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
