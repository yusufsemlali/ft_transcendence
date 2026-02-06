import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@ts-rest/core"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:8080", "127.0.0.1:8080"],
    },
  },
};

export default nextConfig;
