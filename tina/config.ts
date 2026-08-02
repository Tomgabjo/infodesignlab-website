import { defineConfig } from "tinacms";

/**
 * TinaCMS configuration for InfoDesignLab
 *
 * Four collections mirror the four Astro content collections exactly:
 *   caseStudies  — 19 project pages (abstract/article template)
 *   events       — 109 events, 2012–2026 + upcoming
 *   publications — 9 external citations
 *   pages        — 5 prose overview pages (co-design, who-we-are, etc.)
 *
 * CREDENTIALS:
 *   TINA_PUBLIC_CLIENT_ID and TINA_TOKEN must be set as Netlify environment
 *   variables. Never commit values here — the repo is public.
 *
 * IMAGES:
 *   Portfolio images live in public/images/<slug>/ and are served via the
 *   Netlify Image CDN. Tina's media root is set to "images" so uploads from
 *   the /admin UI land in public/images/ alongside migrated files.
 *   Figure and Figures are registered as rich-text templates so Tom can
 *   insert and reorder images in the body without touching code.
 */

const branch =
  process.env.HEAD ||
  process.env.GITHUB_REF_NAME ||
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID!,
  token: process.env.TINA_TOKEN!,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  media: {
    tina: {
      // Uploads land in public/images/ — same directory as migrated assets.
      mediaRoot: "images",
      publicFolder: "public",
    },
  },

  schema: {
    collections: [

      // ─── CASE STUDIES ────────────────────────────────────────────────────
      {
        name: "caseStudies",
        label: "Case Studies",
        path: "src/content/case-studies",
        format: "mdx",
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "string", name: "label", label: "Content-type label" },
          { type: "string", name: "summary", label: "Summary", ui: { component: "textarea" }, required: true },
          {
            type: "object",
            name: "venue",
            label: "Venue",
            fields: [
              { type: "string", name: "label", label: "Label" },
              { type: "string", name: "value", label: "Value" },
            ],
          },
          {
            type: "object",
            name: "authors",
            label: "Authors",
            list: true,
            fields: [
              { type: "string", name: "name", label: "Name", required: true },
              { type: "string", name: "affiliations", label: "Affiliations", list: true },
            ],
          },
          { type: "string", name: "design", label: "Design team", list: true },
          {
            type: "object",
            name: "references",
            label: "References",
            list: true,
            fields: [
              { type: "string", name: "text", label: "Citation text", ui: { component: "textarea" }, required: true },
              { type: "string", name: "href", label: "URL" },
            ],
          },
          { type: "number", name: "year", label: "Year" },
          // Cover image — media picker opens public/images/ via Tina's media root.
          { type: "image", name: "cover", label: "Cover image" },
          { type: "string", name: "coverAlt", label: "Cover alt text" },
          {
            type: "string",
            name: "coverVariant",
            label: "Cover variant",
            options: ["single", "covers"],
          },
          // covers is a trio used only by climate-change-impacts-reports.
          // Kept as string so the existing pub.hyperagent.com URLs are not
          // broken. Upgrade to image[] if Tom needs to edit this field.
          { type: "string", name: "covers", label: "Cover trio images", list: true },
          { type: "number", name: "order", label: "Grid order", required: true },
          { type: "boolean", name: "stub", label: "Stub" },
          { type: "boolean", name: "draft", label: "Draft" },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            // Figure and Figures are available as insertable components in the
            // Tina rich-text editor. The src field uses Tina's media picker so
            // Tom can upload images directly from /admin.
            templates: [
              {
                name: "Figure",
                label: "Figure",
                fields: [
                  { type: "image", name: "src", label: "Image" },
                  { type: "string", name: "alt", label: "Alt text" },
                  { type: "string", name: "caption", label: "Caption" },
                ],
              },
              {
                name: "Figures",
                label: "Figure grid",
                fields: [
                  {
                    // 2 = side-by-side pair (default), 3 = square tile set (e.g. CMCC cards)
                    type: "number",
                    name: "cols",
                    label: "Columns (enter 2 or 3)",
                  },
                  {
                    type: "object",
                    name: "items",
                    label: "Figures",
                    list: true,
                    fields: [
                      { type: "image", name: "src", label: "Image" },
                      { type: "string", name: "alt", label: "Alt text" },
                      { type: "string", name: "caption", label: "Caption" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },

      // ─── EVENTS ──────────────────────────────────────────────────────────
      {
        name: "events",
        label: "Events",
        path: "src/content/events",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "datetime", name: "date", label: "Date", required: true },
          { type: "string", name: "dateLabel", label: "Date label" },
          { type: "string", name: "where", label: "Location", required: true },
          { type: "string", name: "href", label: "URL" },
          {
            type: "string",
            name: "kind",
            label: "Kind",
            options: ["talk", "workshop", "conference", "lecture"],
          },
          { type: "boolean", name: "draft", label: "Draft" },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },

      // ─── PUBLICATIONS ────────────────────────────────────────────────────
      {
        name: "publications",
        label: "Publications",
        path: "src/content/publications",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "string", name: "publisher", label: "Publisher", required: true },
          { type: "datetime", name: "date", label: "Date" },
          { type: "string", name: "dateLabel", label: "Date label" },
          { type: "string", name: "href", label: "URL" },
          { type: "string", name: "authors", label: "Authors", list: true },
          { type: "boolean", name: "draft", label: "Draft" },
        ],
      },

      // ─── PAGES ───────────────────────────────────────────────────────────
      {
        name: "pages",
        label: "Pages",
        path: "src/content/pages",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "string", name: "label", label: "Content-type label" },
          { type: "string", name: "summary", label: "Summary", ui: { component: "textarea" }, required: true },
          { type: "string", name: "inShort", label: "In short note", ui: { component: "textarea" } },
          {
            type: "object",
            name: "seeAlso",
            label: "See also links",
            list: true,
            fields: [
              { type: "string", name: "text", label: "Link text", required: true },
              { type: "string", name: "href", label: "URL", required: true },
            ],
          },
          {
            type: "object",
            name: "capabilities",
            label: "Capabilities list",
            list: true,
            fields: [
              { type: "string", name: "name", label: "Name", required: true },
              { type: "string", name: "note", label: "Note", required: true },
            ],
          },
          {
            type: "object",
            name: "quote",
            label: "Pull quote",
            fields: [
              { type: "string", name: "text", label: "Quote text", ui: { component: "textarea" }, required: true },
              { type: "string", name: "cite", label: "Attribution", required: true },
            ],
          },
          { type: "number", name: "order", label: "Order" },
          { type: "boolean", name: "draft", label: "Draft" },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },

    ],
  },
});
