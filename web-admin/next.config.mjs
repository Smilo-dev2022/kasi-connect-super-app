/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  env: {
    NEXT_PUBLIC_EVENTS_API_BASE: process.env.NEXT_PUBLIC_EVENTS_API_BASE || 'http://localhost:8001',
    NEXT_PUBLIC_MOD_API_BASE: process.env.NEXT_PUBLIC_MOD_API_BASE || 'http://localhost:8002'
  }
};

export default nextConfig;
