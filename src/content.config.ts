import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Content collections — build-time, using the built-in glob loader.
 *
 * These four collections cover the whole site inventory (25 pages) against the
 * three approved templates, so no fourth template is needed:
 *
 *   caseStudies   -> abstract/article template   (17 project pages)
 *   pages         -> overview template           (3 prose pages)
 *   events        -> overview template, hairline-row list variant (~37 events)
 *   publications  -> same list variant           (~10 external citations)
 *
 * Content lives outside src/pages/, so routes are generated explicitly by the
 * route files that call getCollection().
 *
 * Schemas are deliberately strict about the things that must not drift during
 * migration — figure captions, client names and credits are content, not
 * decoration, and the studio's own client work depends on them being exact.
 */

/** A real portfolio figure. Captions are migrated verbatim, never rewritten. */
const figure = z.object({
  src: z.string(),
  /** Caption as published. Substance is never edited during migration. */
  caption: z.string().optional(),
  alt: z.string(),
  /**
   * Real figures sit on white or light backgrounds by design-system rule.
   * Set false only for a figure that carries its own background.
   */
  light: z.boolean().default(true),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/case-studies" }),
  schema: z.object({
    title: z.string(),
    /** Left-rail content-type label, e.g. "Abstract", "Case study". */
    label: z.string().default("Case study"),
    /** Short deck used in listings and as the meta description. */
    summary: z.string(),
    client: z.string().optional(),
    /** Named collaborators and credits, kept exactly as given. */
    credits: z.array(z.string()).default([]),
    year: z.number().optional(),
    /** Card image for the "All work" grid. */
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    /** Trio-of-covers card variant, as used by the country reports. */
    coverVariant: z.enum(["single", "covers"]).default("single"),
    covers: z.array(z.string()).default([]),
    figures: z.array(figure).default([]),
    /** Controls listing order and the "You are here" grid. */
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    label: z.string().default("Overview"),
    summary: z.string(),
    /** Left-rail "In short" note. */
    inShort: z.string().optional(),
    /** Left-rail "See also" links. */
    seeAlso: z.array(z.object({ text: z.string(), href: z.string() })).default([]),
    /** Six-item capability list rendered on hairline rows. */
    capabilities: z
      .array(z.object({ name: z.string(), note: z.string() }))
      .default([]),
    /** Optional pull quote, e.g. the Shobha Maharaj testimonial. */
    quote: z.object({ text: z.string(), cite: z.string() }).optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/events" }),
  schema: z.object({
    title: z.string(),
    /** Real date, so past/upcoming is derived rather than hand-maintained. */
    date: z.coerce.date(),
    /** Display date where the source is vaguer than a day, e.g. "Jan–Mar 2026". */
    dateLabel: z.string().optional(),
    where: z.string(),
    href: z.string().optional(),
    kind: z.enum(["talk", "workshop", "conference", "lecture"]).default("talk"),
    draft: z.boolean().default(false),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/publications" }),
  schema: z.object({
    title: z.string(),
    /** Where it appeared. External citations, so this is required. */
    publisher: z.string(),
    date: z.coerce.date().optional(),
    dateLabel: z.string().optional(),
    /** Citations point outward; the site does not reproduce them. */
    href: z.string().url(),
    authors: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { caseStudies, pages, events, publications };
