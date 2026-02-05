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
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
