const { loadEnvConfig } = require("@next/env");

loadEnvConfig(__dirname);

const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

