/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  basePath: '/jys',
  // Windows에서 .next 캐시 파일 잠금 방지
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  experimental: {
    // mssql/tedious는 네이티브 모듈 → 번들링 제외 (Next.js 14 옵션명)
    serverComponentsExternalPackages: ["mssql", "tedious", "pdfkit", "puppeteer-core"],
    // Windows 파일 시스템 오류(errno -4094) 방지: 워커 스레드 비활성화
    workerThreads: false,
    cpus: 1,
  },
  async redirects() {
    return [
      { source: "/", destination: "/dashboard", permanent: false },
    ];
  },
};

module.exports = nextConfig;
