const { loadEnvConfig } = require("@next/env");

loadEnvConfig(__dirname);

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error("BACKEND_URL is missing. Set BACKEND_URL in frontend/.env");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    proxyTimeout: 300000,
    // Allow large multipart bodies through the Pages API proxy (video uploads ~120MB)
    middlewareClientMaxBodySize: "150mb",
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "node:fs": false,
      "node:https": false,
      "node:path": false,
      "node:os": false,
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      https: false,
      path: false,
      os: false,
    };
    return config;
  },
  async rewrites() {
    // /api/* is handled by pages/api/[...path].js (streaming proxy for large uploads).
    // Only rewrite static media here.
    return [
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

