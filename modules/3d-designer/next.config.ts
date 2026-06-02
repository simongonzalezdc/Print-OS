import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack configuration - explicitly set root to avoid multiple lockfiles warning
  turbopack: {
    root: __dirname, // Point to current directory to avoid lockfiles conflicts
  },

  // Headers for better performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;