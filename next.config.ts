import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode double-invokes effects in development to surface side-effect bugs.
  // Disabled here to prevent double API calls during dev; re-enable periodically to audit.
  reactStrictMode: false,

  // Disable image optimization
  images: {
    unoptimized: true,
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
