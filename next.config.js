/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n,
  images: {
    domains: ['localhost', 'judge.ca', 'vercel.app'],
  },
  // Remove API rewrites for Vercel deployment - use serverless functions
};

module.exports = nextConfig;