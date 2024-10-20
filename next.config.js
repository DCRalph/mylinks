/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  images: {
    domains: ["cdn.discordapp.com","lh3.googleusercontent.com"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com"',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      }
    ],
  },
};

export default config;
