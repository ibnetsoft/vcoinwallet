import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // firebase-admin은 서버 사이드에서만 사용
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('firebase-admin');
    }
    return config;
  },
};

export default nextConfig;
