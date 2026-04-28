import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/asset-insights' : '';

const nextConfig: NextConfig = {
  output: 'export',
  // 根據環境動態設定 basePath，GitHub Pages 需要子路徑，其餘環境（如 Firebase 預覽）則使用根目錄
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
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
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
