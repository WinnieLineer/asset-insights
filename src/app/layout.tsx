import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Survey Corps Command | 調查兵團戰術本部',
  description: '獻出你的心臟！人類奪還財富領土的最終作戰系統。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Titan Command',
  },
};

export const viewport: Viewport = {
  themeColor: '#2D4B33',
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
    <html lang="zh-TW" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico?favicon.7ed73651.ico" />
      </head>
      <body className="font-body antialiased selection:bg-primary/40 bg-[#0A0A0A]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}