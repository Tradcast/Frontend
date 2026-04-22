const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Do not use `output: 'standalone'` if you run `next start` on the VPS.
  // Standalone requires `node .next/standalone/server.js` + copying static files;
  // otherwise you get Server Action mismatches, broken middleware (404), and warnings.
  // Uncomment for Docker images that follow https://nextjs.org/docs/app/api-reference/next-config-js/output
  // output: 'standalone',

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    // Some branches still import the deprecated frame-sdk path.
    // Map it to miniapp-sdk so both import paths keep working in CI.
    config.resolve.alias['@farcaster/frame-sdk'] = '@farcaster/miniapp-sdk';
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
