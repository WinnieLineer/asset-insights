import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* 為了部署到 GitHub Pages，設定為靜態導出 */
  output: 'export',
  /* GitHub Pages 不支援 Next.js 預設的圖片優化，必須設為 unoptimized */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    // 雖然我們已經修復了錯誤，但在 CI 環境下嚴格檢查
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
