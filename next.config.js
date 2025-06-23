/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure for Netlify deployment
  trailingSlash: true,
  // Allow importing of Go/Python files for the compiler
  webpack: (config, { isServer }) => {
    // Only add raw-loader for client-side builds to avoid issues
    if (!isServer) {
      config.module.rules.push({
        test: /\.(go|py)$/,
        use: 'raw-loader',
      });
    }

    // Ensure proper module resolution for @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    return config;
  },
};

module.exports = nextConfig;