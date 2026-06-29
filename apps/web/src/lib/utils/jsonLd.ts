import { site } from "@/lib/constants";

type Json = Record<string, unknown>;

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.publisher,
    url: site.url,
    description: site.description,
  };
}

export function webSiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: ["en", "am"],
  };
}

/** schema.org/Dataset — the right structured-data type for a research data page (AEO). */
export function datasetLd(input: {
  name: string;
  description: string;
  path: string;
  spatial?: string;
  temporal?: string;
  creator?: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: input.name,
    description: input.description,
    url: `${site.url}${input.path}`,
    isAccessibleForFree: true,
    spatialCoverage: input.spatial ?? "Ethiopia",
    temporalCoverage: input.temporal,
    creator: { "@type": "Organization", name: input.creator ?? site.publisher },
    publisher: { "@type": "Organization", name: site.publisher },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}
