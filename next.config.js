/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Allow importing of Go/Python files for the compiler
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(go|py)$/,
      use: 'raw-loader',
    });
    return config;
  },
};

module.exports = nextConfig;