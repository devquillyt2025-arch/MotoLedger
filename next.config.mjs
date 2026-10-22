/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build use its own folder so it never clobbers a running `next dev` (.next by default).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Every page reads live ledger data; don't let the client router replay a tab's old render for 30s
    // after something changed (another device, another tab, a profile switch).
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
