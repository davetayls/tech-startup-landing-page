import { withUniformConfig } from "@uniformdev/canvas-next-rsc/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
}

export default withUniformConfig(nextConfig);
