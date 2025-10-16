/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@kasi/common-types"],
  env: {
    NEXT_PUBLIC_EVENTS_API_BASE: process.env.NEXT_PUBLIC_EVENTS_API_BASE || 'http://localhost:8000',
    NEXT_PUBLIC_MOD_API_BASE: process.env.NEXT_PUBLIC_MOD_API_BASE || 'http://localhost:8082'
  }
};

export default nextConfig;
