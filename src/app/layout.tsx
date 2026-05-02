import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: 'Asset Insights',
  description: '全方位的個人資產管理與 AI 智慧財務決策系統。',
  icons: {
    icon: [
      { url: `${basePath}/app-icon.png?v=1.0.5` },
      { url: `${basePath}/favicon.ico?v=1.0.5`, sizes: 'any' },
    ],
    apple: `${basePath}/app-icon.png?v=1.0.5`,
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
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
    <html lang="zh-TW" className="light scroll-smooth">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.er-api.com https://*.clarity.ms; img-src 'self' data: https:; object-src 'none'; connect-src 'self' https://*.clarity.ms https://*.bing.com https://*.er-api.com https://*.googleapis.com https://api.github.com https://script.google.com https://script.googleusercontent.com;" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=Zen+Maru+Gothic:wght@400;500;700;900&family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "whrwszudlp");
            `
          }}
        />
      </head>
      <body className="font-sans selection:bg-primary/10">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
