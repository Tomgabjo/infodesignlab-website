#!/usr/bin/env python3
"""
Apply InfoDesignLab TinaCMS template changes to tina/config.ts.

Changes:
  1. mediaRoot: "" → "images"  (uploads land in public/images/, not public/ root)
  2. cover field: type "string" → type "image"  (media picker instead of text box)
  3. body field: add Figure and Figures as rich-text templates  (insertable from /admin)

Run this locally (after npm ci) and then run:
  NODE_OPTIONS=--max-old-space-size=8192 npx tinacms build --skip-cloud-checks
to regenerate tina-lock.json, then commit both files.
"""

import sys
from pathlib import Path

config_path = Path(__file__).parent.parent / "tina" / "config.ts"
text = config_path.read_text()

# ── 1. mediaRoot ──────────────────────────────────────────────────────────────
old = '      mediaRoot: "",'
new = '      mediaRoot: "images",'
if old not in text:
    print("ERROR: mediaRoot pattern not found — config may have already changed.", file=sys.stderr)
    sys.exit(1)
text = text.replace(old, new)

# ── 2. cover: string → image ──────────────────────────────────────────────────
old = '          { type: "string", name: "cover", label: "Cover image" },'
new = '          { type: "image", name: "cover", label: "Cover image" },'
if old not in text:
    print("ERROR: cover string field pattern not found.", file=sys.stderr)
    sys.exit(1)
text = text.replace(old, new)

# ── 3. body: add Figure + Figures templates ───────────────────────────────────
old_body = '          { type: "rich-text", name: "body", label: "Body", isBody: true },'

new_body = '''\
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            templates: [
              {
                name: "Figure",
                label: "Figure",
                match: { start: "<Figure", end: "/>" },
                fields: [
                  { type: "string", name: "src", label: "Image path" },
                  { type: "string", name: "alt", label: "Alt text" },
                  { type: "string", name: "caption", label: "Caption" },
                ],
              },
              {
                name: "Figures",
                label: "Figures (grid)",
                match: { start: "<Figures", end: "/>" },
                fields: [
                  { type: "number", name: "cols", label: "Columns" },
                  {
                    type: "object",
                    name: "items",
                    label: "Images",
                    list: true,
                    fields: [
                      { type: "string", name: "src", label: "Image path" },
                      { type: "string", name: "alt", label: "Alt text" },
                      { type: "string", name: "caption", label: "Caption" },
                    ],
                  },
                ],
              },
            ],
          },'''

# Only the caseStudies body (line 95) — not the pages body (line 180)
# They share the same text, so we replace only the first occurrence.
count = text.count(old_body)
if count == 0:
    print("ERROR: body field pattern not found.", file=sys.stderr)
    sys.exit(1)
text = text.replace(old_body, new_body, 1)   # replace first occurrence only

config_path.write_text(text)

# ── Verify ────────────────────────────────────────────────────────────────────
errors = []
if 'mediaRoot: "images"' not in text:
    errors.append("mediaRoot not updated")
if 'type: "image", name: "cover"' not in text:
    errors.append("cover type not updated")
if '"Figure"' not in text or 'templates:' not in text:
    errors.append("Figure/Figures templates not added")

if errors:
    for e in errors:
        print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)

print("tina/config.ts updated:")
print("  ✓ mediaRoot set to 'images'")
print("  ✓ cover field type changed to 'image'")
print("  ✓ Figure + Figures templates added to caseStudies body")
