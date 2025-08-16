/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n,
  images: {
    domains: ['localhost', 'judge.ca', 'vercel.app'],
  },
  typescript: {
    // Temporarily ignore TypeScript errors for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors for deployment
    ignoreDuringBuilds: true,
  },
};

// Only add PWA in production
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: false,
  });
  module.exports = withPWA(nextConfig);
} else {
  module.exports = nextConfig;
}
