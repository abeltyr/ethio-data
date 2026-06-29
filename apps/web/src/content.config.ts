import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// Read the editorial markdown straight from the repo-root showcase/ folder — no duplication.
// Each file becomes an entry whose id is its filename (e.g. "A-Z-showcase-ideas").
const showcase = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "../../showcase" }),
});

export const collections = { showcase };
