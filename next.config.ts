import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'cdn-icons-png.flaticon.com', // سمحنا باستخدام الصور من هذا الموقع
      'example.com' // أضف دومينات أخرى هنا
    ],
  },
};

export default nextConfig;