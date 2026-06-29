import { defineConfig, passthroughImageService } from "astro/config";

// The site renders the editorial content in ../../showcase and can later read the domain
// databases in ../../data/db via @ethiodata/database. There are no images to optimise, so we
// use the passthrough image service to avoid pulling the heavy native `sharp` dependency.
export default defineConfig({
  site: "https://example.com",
  image: { service: passthroughImageService() },
});
