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
};

module.exports = nextConfig;
