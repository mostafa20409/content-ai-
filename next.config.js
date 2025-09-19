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
  generateEtags: false,
  
  reactStrictMode: true,
  
  // إعدادات الأداء المحسنة
  experimental: {
    scrollRestoration: true,
    optimizeCss: false,
    // إضافة إعدادات جديدة لتقليل الذاكرة
    workerThreads: false,
    cpus: 1
  },
  
  // إعدادات Webpack محسنة
  webpack: (config, { isServer, dev }) => {
    // تقليل استخدام الذاكرة
    config.cache = {
      type: 'filesystem',
      maxAge: 24 * 60 * 60 * 1000, // يوم واحد فقط
      memoryCacheUnaffected: false
    };

    // تحسين تقسيم الحزم للإنتاج فقط
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // تقليل الحجم الأقصى
          cacheGroups: {
            default: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 3, // زيادة من 2 إلى 3
              reuseExistingChunk: true,
            },
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              chunks: 'all',
              priority: 20,
            },
            vendor: {
              name: 'vendors',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },

  // إعدادات الرأس المحسنة
  async headers() {
    return [
      {
        source: '/:path*',
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
        ],
      }
    ];
  },

  // إعدادات compiler محسنة
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // تحسين إعادة التوجيه
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;