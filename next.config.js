const path = require('path');
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
    ];
  },

  // Do not use `output: 'standalone'` if you run `next start` on the VPS.
  // Standalone requires `node .next/standalone/server.js` + copying static files;
  // otherwise you get Server Action mismatches, broken middleware (404), and warnings.
  // Uncomment for Docker images that follow https://nextjs.org/docs/app/api-reference/next-config-js/output
  // output: 'standalone',

  experimental: {
    // Monorepo only: trace deps from repo root. Remove if `apps/web` is deployed alone.
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },

  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
