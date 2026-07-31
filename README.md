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

## Local development

```bash
npm install
npm run dev      # local server
npm run build    # static build to dist/
```

## Contact

post@infodesignlab.com
