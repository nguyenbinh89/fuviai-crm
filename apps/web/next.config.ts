import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output để đóng gói vào Docker image nhỏ gọn
  output: 'standalone',

  // Transpile shared packages từ monorepo
  transpilePackages: ['@fuviai/ui'],

  // Tối ưu hình ảnh
  images: {
    domains: ['localhost', 'crm.fuviai.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.fuviai.com' },
    ],
  },

  // Không cần trailing slash
  trailingSlash: false,
};

export default nextConfig;
