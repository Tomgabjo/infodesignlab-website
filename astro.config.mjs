// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

/**
 * Static output. The site is text plus real portfolio figures — no forms, no
 * embedded video, no interactive widgets — so there is nothing that needs a
 * server, and static gives the best resilience and SEO.
 *
 * `site` must be the real production origin for canonical URLs, Open Graph
 * images and the sitemap to be correct. It is a placeholder until the Netlify
 * site exists; set it to the custom domain at the cutover from Squarespace.
 */
export default defineConfig({
  site: "https://infodesignlab.netlify.app",

  integrations: [
    mdx(),
    sitemap(),
  ],

  image: {
    // sharp handles the ~150 migrated portfolio images at build time.
    // Widths chosen for the layouts actually in use: the split-screen media
    // panel, work-plug images at --measure, and the 230px-min card grid.
    responsiveStyles: true,
    layout: "constrained",
  },

  build: {
    // Directory-style URLs, matching the existing Squarespace paths so
    // inbound links and search results survive the migration.
    format: "directory",
  },

  devToolbar: {
    // The studio are non-developers; the toolbar is noise in review sessions.
    enabled: false,
  },
});
