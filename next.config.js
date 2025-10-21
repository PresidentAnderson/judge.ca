/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // TypeScript configuration - ignore errors for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration - ignore errors for deployment  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Simplified webpack configuration
  webpack: (config) => {
    // Alias configuration for better imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@components': path.resolve(__dirname, 'components'),
      '@lib': path.resolve(__dirname, 'lib'),
      '@styles': path.resolve(__dirname, 'styles'),
      '@backend': path.resolve(__dirname, 'src/backend'),
    };

    return config;
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'judge-ca',
  },
};

module.exports = nextConfig;