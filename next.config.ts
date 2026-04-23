import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '52mb',
    },
    // proxy.ts buffers request bodies; default 10MB would truncate /api/upload (50MB cap).
    proxyClientMaxBodySize: '52mb',
  },
};

export default nextConfig;
