import { defineConfig } from "tinacms";

/**
 * TinaCMS configuration for InfoDesignLab
 *
 * Four collections mirror the four Astro content collections exactly:
 *   caseStudies  — 18 project pages (abstract/article template)
 *   events       — 109 events, 2012–2026 + upcoming
 *   publications — 9 external citations
 *   pages        — 5 prose overview pages (co-design, who-we-are, etc.)
 *
 * CREDENTIALS:
 *   TINA_PUBLIC_CLIENT_ID and TINA_TOKEN must be set as Netlify environment
 *   variables (Site configuration → Environment variables). Never commit
 *   values here — the repo is public.
 *
 * GITHUB APP:
 *   Tina Cloud's GitHub App must be installed on Tomgabjo/infodesignlab-website
 *   so the CMS can commit content edits. This happens automatically on first
 *   save via the /admin panel (Tina Cloud checklist step 4).
 */

const branch =
  process.env.HEAD ||               // Netlify sets HEAD to the deploy branch
  process.env.GITHUB_REF_NAME ||    // fallback for other CI
  "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_PUBLIC_CLIENT_ID!,
  token: process.env.TINA_TOKEN!,

  build: {
    outputFolder: "admin",   // → public/admin/ → served at /admin/
    publicFolder: "public",
  },

  // Media: images live in src/assets/ (processed by Astro/sharp) so we
  // disable Tina's own media manager for case-study figures. Plain-string
  // fields are used for cover images instead.
  media: {
    tina: {
      mediaRoot: "",
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
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "label",
            label: "Content-type label",
            ui: { description: 'Left-rail badge, e.g. "Case study", "Abstract"' },
          },
          {
            type: "string",
            name: "summary",
            label: "Summary",
            ui: {
              component: "textarea",
              description: "Used in listings and as the meta description.",
            },
            required: true,
          },
          {
            type: "object",
            name: "venue",
            label: "Venue",
            ui: { description: "Where the piece was published or presented." },
            fields: [
              {
                type: "string",
                name: "label",
                label: "Label",
                ui: { description: 'e.g. "Published in", "Abstract for the", "Prepared for"' },
              },
              { type: "string", name: "value", label: "Value" },
            ],
          },
          {
            type: "object",
            name: "authors",
            label: "Authors",
            list: true,
            ui: {
              description:
                "Paper or abstract authors. Omit affiliations if unknown — never guess.",
              itemProps: (item: Record<string, unknown>) => ({
                label: (item?.name as string) || "Author",
              }),
            },
            fields: [
              { type: "string", name: "name", label: "Name", required: true },
              {
                type: "string",
                name: "affiliations",
                label: "Affiliations",
                list: true,
                ui: { description: "One entry per institution. Omit rather than guess." },
              },
            ],
          },
          {
            type: "string",
            name: "design",
            label: "Design team",
            list: true,
            ui: {
              description:
                "Names of the people who did the design work — distinct from paper authors.",
            },
          },
          {
            type: "object",
            name: "references",
            label: "References",
            list: true,
            ui: {
              description: "Left-rail citations. Verbatim — do not paraphrase.",
              itemProps: (item: Record<string, unknown>) => ({
                label:
                  typeof item?.text === "string"
                    ? item.text.slice(0, 60) + "…"
                    : "Reference",
              }),
            },
            fields: [
              {
                type: "string",
                name: "text",
                label: "Citation text",
                ui: { component: "textarea" },
                required: true,
              },
              {
                type: "string",
                name: "href",
                label: "URL (DOI or publisher link)",
                ui: { description: "Optional — omit if no confirmed URL exists." },
              },
            ],
          },
          { type: "number", name: "year", label: "Year" },
          {
            type: "string",
            name: "cover",
            label: "Cover image",
            ui: {
              description:
                "Path to a local src/assets/<slug>/ file or a remote URL. Agent manages these.",
            },
          },
          { type: "string", name: "coverAlt", label: "Cover alt text" },
          {
            type: "string",
            name: "coverVariant",
            label: "Cover variant",
            options: [
              { value: "single", label: "Single image" },
              { value: "covers", label: "Trio of covers (country reports)" },
            ],
          },
          {
            type: "string",
            name: "covers",
            label: "Cover trio images",
            list: true,
            ui: { description: 'Used when coverVariant is "covers".' },
          },
          {
            type: "number",
            name: "order",
            label: "Grid order",
            required: true,
            ui: { description: "Controls position in the work grid. Must be unique." },
          },
          {
            type: "boolean",
            name: "stub",
            label: "Stub",
            ui: { description: "Listed in the grid but has no page yet." },
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
            ui: { description: "Hidden from the site entirely." },
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },

      // ─── EVENTS ──────────────────────────────────────────────────────────
      {
        name: "events",
        label: "Events",
        path: "src/content/events",
        format: "md",
        defaultItem: () => ({
          kind: "talk",
          draft: false,
        }),
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
            ui: {
              description:
                "Used to split upcoming / past. Set to the first day of the month when only a month is given.",
              dateFormat: "YYYY-MM-DD",
            },
          },
          {
            type: "string",
            name: "dateLabel",
            label: "Date label",
            ui: {
              description:
                'Display text when source is vaguer than a day, e.g. "Jan–Mar 2026". Leave blank if the date is exact.',
            },
          },
          {
            type: "string",
            name: "where",
            label: "Location",
            required: true,
            ui: { description: 'e.g. "SEAS, Fondazione Golinelli, Bologna"' },
          },
          {
            type: "string",
            name: "href",
            label: "URL",
            ui: { description: "Optional event or registration link." },
          },
          {
            type: "string",
            name: "kind",
            label: "Kind",
            options: [
              { value: "talk", label: "Talk" },
              { value: "workshop", label: "Workshop" },
              { value: "conference", label: "Conference" },
              { value: "lecture", label: "Lecture" },
            ],
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
            ui: { description: "Hidden from the site." },
          },
        ],
      },

      // ─── PUBLICATIONS ────────────────────────────────────────────────────
      {
        name: "publications",
        label: "Publications",
        path: "src/content/publications",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "publisher",
            label: "Publisher",
            required: true,
            ui: { description: 'e.g. "Climatic Change (Springer Nature)"' },
          },
          {
            type: "datetime",
            name: "date",
            label: "Date",
            ui: { dateFormat: "YYYY-MM-DD" },
          },
          {
            type: "string",
            name: "dateLabel",
            label: "Date label",
            ui: { description: 'e.g. "2021" when only a year is known.' },
          },
          {
            type: "string",
            name: "href",
            label: "URL",
            ui: {
              description:
                "DOI or publisher link. Must be confirmed — never guess a URL.",
            },
          },
          {
            type: "string",
            name: "authors",
            label: "Authors",
            list: true,
          },
          {
            type: "boolean",
            name: "draft",
            label: "Draft",
          },
        ],
      },

      // ─── PAGES (prose overview pages) ────────────────────────────────────
      {
        name: "pages",
        label: "Pages",
        path: "src/content/pages",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "label",
            label: "Content-type label",
            ui: { description: 'Left-rail badge, e.g. "Overview"' },
          },
          {
            type: "string",
            name: "summary",
            label: "Summary",
            ui: { component: "textarea" },
            required: true,
          },
          {
            type: "string",
            name: "inShort",
            label: '"In short" note',
            ui: {
              component: "textarea",
              description: "Short left-rail summary.",
            },
          },
          {
            type: "object",
            name: "seeAlso",
            label: "See also links",
            list: true,
            ui: {
              itemProps: (item: Record<string, unknown>) => ({
                label: (item?.text as string) || "Link",
              }),
            },
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
            ui: {
              description: "Six-item list rendered on hairline rows.",
              itemProps: (item: Record<string, unknown>) => ({
                label: (item?.name as string) || "Capability",
              }),
            },
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
              {
                type: "string",
                name: "text",
                label: "Quote text",
                ui: { component: "textarea" },
                required: true,
              },
              { type: "string", name: "cite", label: "Attribution", required: true },
            ],
          },
          { type: "number", name: "order", label: "Order" },
          { type: "boolean", name: "draft", label: "Draft" },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
          },
        ],
      },
    ],
  },
});
