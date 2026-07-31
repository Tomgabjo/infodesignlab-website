# Migration scripts

## extract-squarespace.py

Pulls copy and images, **in document order**, out of a live Squarespace project
page. Used to migrate the 17 `/selected-projects/<slug>` pages.

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
curl -sL -A "$UA" "https://www.infodesignlab.com/selected-projects/<slug>" -o /tmp/<slug>.html
python3 scripts/extract-squarespace.py /tmp/<slug>.html /tmp/<slug>.json
```

Output is a JSON array of nodes, each either
`{type: "p"|"h1".."h4"|"li"|"figcaption"|"blockquote", text}` or
`{type: "img", src, best, w, alt}`, where `best` is the widest `srcset`
candidate (2500w on every page checked).

### Things that will bite you

- **A browser User-Agent is required.** Without one the project pages return
  **503**, even though `/selected-projects` itself serves fine.
- **Squarespace serves WebP under `.jpg` filenames.** Content negotiation means
  the bytes are WebP whatever the URL says. Check with `sharp().metadata()` and
  rename to `.webp`, or Astro's image pipeline will mis-handle them.
- **Regex will not parse these pages.** Block markup is deeply nested and
  `sqs-block` classes are not reliable; this uses `html.parser` for that reason.
- Pages carry a **duplicated intro** (one `h3` repeating the first paragraph) —
  a responsive-variant artefact. Drop it.
