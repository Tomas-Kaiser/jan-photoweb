import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jan Hájek Photography",
    short_name: "Jan Hájek",
    description: "Photography portfolio of Jan Hájek.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#171717",
    icons: [
      {
        src: "/icon.png",
        sizes: "554x548",
        type: "image/png",
      },
    ],
  };
}
