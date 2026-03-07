/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output chỉ dùng khi build Docker (DOCKER_BUILD=true)
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),

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
