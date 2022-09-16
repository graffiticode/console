/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [{
      source: '/docs',
      destination: 'https://docs.artcompiler.com',
    }];
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, ...{ topLevelAwait: true }};
    return config;
  },
};

module.exports = nextConfig;
