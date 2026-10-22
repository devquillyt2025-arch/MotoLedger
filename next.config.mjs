/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build use its own folder so it never clobbers a running `next dev` (.next by default).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
