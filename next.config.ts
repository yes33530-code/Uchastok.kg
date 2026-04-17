import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '52mb', // Matches the 50 MB file size limit in uploadPlotFile
    },
  },
};

export default nextConfig;
