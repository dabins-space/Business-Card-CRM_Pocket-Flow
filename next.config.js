/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  // SSR 문제 해결을 위한 설정
  experimental: {
    esmExternals: false,
  },
  // 정적 페이지 생성 시 오류 방지
  trailingSlash: false,
  // 동적 라우팅 비활성화 (SSR 오류 방지)
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

module.exports = nextConfig