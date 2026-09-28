import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['mysql2'],
  turbopack: {root: process.cwd()},
};

export default nextConfig;
