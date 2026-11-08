import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE_STRING } from "next/dist/shared/lib/router/utils/is-bot";
import { getProofLinkRewrites } from "./app/lib/proof-link";

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const nextConfig: NextConfig = {
  // Next streams metadata into the body for crawlers it doesn't list, and
  // Telegram's isn't listed — this keeps gallery link previews in <head>.
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE_STRING}|TelegramBot`, "i"),
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
