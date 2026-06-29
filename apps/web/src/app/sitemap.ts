import type { MetadataRoute } from "next";
import { NAV, site } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  return NAV.map((item) => ({
    url: `${site.url}${item.href === "/" ? "" : item.href}`,
    changeFrequency: "weekly",
    priority: item.href === "/" ? 1 : 0.8,
  }));
}
