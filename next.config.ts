import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ehhcbsxrpaziywth.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
