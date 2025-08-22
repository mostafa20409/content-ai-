/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  compress: true,
  poweredByHeader: false,
  
  // إزالة i18n لأنه غير مدعوم في App Router
  // استخدام middleware بدلاً منه للتعامل مع اللغات
  
  reactStrictMode: true,
  // swcMinify: true, // تم إزالته لأنه غير معترف به في الإصدارات الحديثة
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      }
    ];
  },
};

module.exports = nextConfig;