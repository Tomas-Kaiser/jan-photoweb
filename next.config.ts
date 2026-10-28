import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const nextConfig: NextConfig = {
  // Client-facing proof links use a friendlier, localized segment
  // (/en/photos/<token>, /cs/fotky/<token>) — both are served by the
  // existing /[locale]/proof/[token] route, which keeps working for links
  // already sent out. See app/lib/proof-link.ts.
  async rewrites() {
    return [
      {
        source: "/:locale(en|cs)/:segment(photos|fotky)/:token",
        destination: "/:locale/proof/:token",
      },
    ];
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
