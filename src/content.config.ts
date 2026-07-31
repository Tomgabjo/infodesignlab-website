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

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/case-studies" }),
  // The schema is a function so it can use image(), which validates a local
  // file path and hands the template an ImageMetadata object that sharp can
  // process. Migrated pages use local files; not-yet-migrated stubs still
  // point at remote URLs, so cover accepts either.
  schema: ({ image }) =>
    z.object({
    title: z.string(),
    /** Left-rail content-type label, e.g. "Abstract", "Case study". */
    label: z.string().default("Case study"),
    /** Short deck used in listings and as the meta description. */
    summary: z.string(),
    /**
     * First meta-rail block: where the piece was published or presented.
     * Kept as label + value because the label wording varies by piece
     * ("Abstract for the", "Published in", "Prepared for").
     */
    venue: z.object({ label: z.string(), value: z.string() }).optional(),
    /**
     * Authors with affiliations, as the rail renders them: name in ink,
     * affiliations beneath in muted mono. Migrated verbatim — this is how
     * collaborators are credited, not decoration.
     *
     * `affiliations` is an ARRAY because authors genuinely hold more than one:
     * Shobha Maharaj on the Overshoot abstract has two, listed on separate
     * lines in the source. The prototype flattened them into one string joined
     * by "·", which misrepresented two institutions as one.
     */
    authors: z
      .array(
        z.object({
          name: z.string(),
          /**
           * Optional: a published paper's full author list is often available
           * without affiliations, and inventing one would be a fabricated
           * credit. Omit rather than guess — the rail renders the name alone.
           */
          affiliations: z.array(z.string()).default([]),
        })
      )
      .default([]),
    /**
     * Who did the DESIGN work, as distinct from the paper's authors. On science
     * collaborations these are different groups of people, and conflating them
     * misattributes the work in both directions.
     */
    design: z.array(z.string()).default([]),
    /**
     * References, rendered in the left rail rather than at the foot of the
     * article. Citations are migrated verbatim, punctuation and capitalisation
     * included — scholarly attribution, not copy to tidy.
     */
    references: z
      .array(z.object({ text: z.string(), href: z.string().optional() }))
      .default([]),
    year: z.number().optional(),
    /**
     * Card image for the work grid. A local path (optimised by sharp) once the
     * page is migrated; a remote URL while it is still a stub.
     */
    cover: z.union([image(), z.string()]).optional(),
    coverAlt: z.string().default(""),
    /** Trio-of-covers card variant, as used by the country reports. */
    coverVariant: z.enum(["single", "covers"]).default("single"),
    covers: z.array(z.union([image(), z.string()])).default([]),
    /** Controls grid order. */
    order: z.number().default(0),
    /**
     * A stub is listed in the work grid but has no page yet, so its card
     * renders as a non-link — exactly what the signed-off prototypes did with
     * their href="#" cards. Route generation skips stubs, so migrating one is
     * just deleting this flag and adding the body copy.
     */
      stub: z.boolean().default(false),
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
