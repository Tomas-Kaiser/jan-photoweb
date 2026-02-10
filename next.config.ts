import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
    ],
  },
  i18n
};

export default nextConfig;
