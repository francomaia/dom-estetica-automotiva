/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['mysql2', 'web-push'],
  turbopack: {root: process.cwd()},
};

export default nextConfig;
