/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['mysql2'],
  turbopack: {root: process.cwd()},
};

export default nextConfig;
