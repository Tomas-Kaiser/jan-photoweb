import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { getProofLinkRewrites } from "./app/lib/proof-link";

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const nextConfig: NextConfig = {
  // Client-facing proof links use a friendlier, localized segment
  // (/en/photos/<token>, /cs/fotky/<token>) — both are served by the
  // existing /[locale]/proof/[token] route, which keeps working for links
  // already sent out. The segments are defined in app/lib/proof-link.ts.
  async rewrites() {
    return getProofLinkRewrites();
  },
  images: {
    // Cloudflare Images already resizes/re-encodes everything via its own
    // named variants (card/detail/full)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
    ],
  },
};

// Wrap the config with the plugin
export default withNextIntl(nextConfig);
