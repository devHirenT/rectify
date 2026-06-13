/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Consume the workspace TypeScript/ESM packages directly.
  transpilePackages: [
    '@shikaku/achievements',
    '@shikaku/ads',
    '@shikaku/analytics',
    '@shikaku/audio',
    '@shikaku/game-engine',
    '@shikaku/rewards',
    '@shikaku/storage',
  ],
};

export default nextConfig;
