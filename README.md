# infodesignlab-website

The InfoDesignLab website — an information design studio in Oslo making climate
science legible. Replaces the previous Squarespace site.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Site | [Astro](https://astro.build) | Static output, content collections, built-in image optimisation |
| Editing | [TinaCMS](https://tina.io) | Git-based, imposes no design constraints |
| Hosting | [Netlify](https://netlify.com) | Free tier, preview deploy per change, one-click rollback |
| Source | GitHub | Full history; content and code in one place |

Content lives as markdown in the repository, so every edit is a commit with an
author and a diff, and any change can be rolled back.

## Structure

Three page templates carry the whole site:

- **Homepage** — mission, selected work, latest events, clients ticker
- **Article** — case studies, abstracts and postings
- **Overview** — prose pages, plus list and grid variants for Selected
  projects, Latest events and Publications

## Operating model

- **Content** — edited by InfoDesignLab through TinaCMS. No code required.
- **Design and code** — changed via this repository, with a Netlify preview
  per change.

## Design system

Locked. The short version:

- Canvas `#f2f2f2`; menu panel `#ffe7e7`
- Exactly **three** typefaces: grotesque for display and body, serif for
  long-form article body and menu descriptions, mono for small labels and
  metadata only
- Light, large headings — hero at weight 300, secondary at 400
- Contained split-screen layouts, never full-width stacked bands
- A shared `--measure` right edge governs titles, body copy and hairline rules
  alike, so text and rules terminate together
- Real portfolio figures only, on white or light backgrounds
- **Space below a figure equals the space above it.** `.fig` and `.figs` carry
  the same margin top and bottom. The prototypes set a top margin only, which
  read lopsided

## Case study conventions

These are settled. They apply to every case study, including the sixteen still
to be migrated.

### Section headings are required

Every case study is broken into sections with `## ` headings, **even though the
old Squarespace pages have none**. Continuous prose was a limitation of the old
site, not a choice worth carrying over. Headings render at `--w-secondary`.

Use this vocabulary, in this order, including only the sections that apply:

| Heading | Holds |
| --- | --- |
| `## What was done` | The problem, the brief, what the work is |
| `## How it was done` | Process, method, co-design cycles |
| `## By whom` | The collaborating team, when it is worth naming in prose |
| `## What conclusions were drawn` | Findings and argument |
| `## What came next` | Follow-on outcomes — a platform, a second edition, adoption |

Do not invent new headings without adding them to this table first. A consistent
spine across seventeen pages is worth more than a bespoke structure per page.

### Copy fidelity depends on the source

- **Papers, abstracts and other published scholarly text: VERBATIM.** Do not
  rephrase, compress or "improve" it. It is a copy of a publication and reads
  wrong if edited — including its original punctuation and any small grammatical
  quirks.
- **Studio-written case-study prose: may be lightly tightened** for the
  asymmetric grid. Compression only; substance, claims, client names and figure
  captions never change.

When in doubt, treat it as verbatim and ask.

### Attribution lives in the left rail

Column one carries the metadata, quietly, in mono: `venue`, `authors`, `design`
and `references`. None of it belongs in the body copy.

- `authors` — the publication's author list. `affiliations` is optional and must
  be **omitted rather than guessed**; a fabricated affiliation is a false credit.
- `design` — who did the design work. Deliberately separate from `authors`,
  because on science collaborations these are different groups of people.
- `references` — full citations, migrated verbatim, each with an optional
  `href`. They sit in the rail, not at the foot of the article, so they are
  present and checkable without competing with the prose.

## Local development

```bash
npm install
npm run dev      # local server
npm run build    # static build to dist/
```

## Contact

post@infodesignlab.com
