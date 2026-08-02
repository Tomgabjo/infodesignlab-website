#!/usr/bin/env python3
"""
Path A — Transform case-study MDX files for TinaCMS compatibility.

Moves images from imported local assets to /images/<slug>/ URL strings so
TinaCMS can parse and write the MDX body without encountering import statements.

What this does to each .mdx file in src/content/case-studies/:

  FRONTMATTER
  1. Rewrite cover/covers paths from "../../assets/<slug>/..." to "/images/<slug>/..."

  BODY
  2. Strip all import lines (component imports AND image variable imports).
     Component imports are not needed in the body because mdxComponents in
     src/pages/selected-projects/[...slug].astro provides Figure and Figures globally.
  3. Replace src={varname} with src="/images/<slug>/filename.ext" using the
     variable→path map built from the image import lines.
  4. Convert <Figures cols={N}>...</Figures> blocks into
     <Figures cols={N} items={[{src:"...",alt:"...",caption:"..."},...]} />
     The list form is required because Tina rich-text templates use list fields,
     and the existing six-image block cannot be expressed as fixed props.

Run from the repo root:
  python3 scripts/transform-mdx-images.py [--dry-run]

With --dry-run, prints diffs but writes nothing.
"""

import re
import sys
import os
from pathlib import Path

DRY_RUN = "--dry-run" in sys.argv

CONTENT_DIR = Path("src/content/case-studies")
ASSETS_DIR = Path("src/assets")

def slug_from_path(mdx_path: Path) -> str:
    return mdx_path.stem

def build_import_map(body_lines: list[str], slug: str) -> dict[str, str]:
    """
    Parse lines like:
      import img0 from "../../assets/ipcc-reports/00-img.jpg";
      import hero from "../../assets/overshoot-annual-review/00-infodesignlab-ar-48.webp";
    Returns {varname: "/images/slug/filename.ext"}
    """
    imp = {}
    pattern = re.compile(r'^import\s+(\w+)\s+from\s+"[^"]*assets/[^/]+/([^"]+)"\s*;')
    for line in body_lines:
        m = pattern.match(line.strip())
        if m:
            varname, filename = m.group(1), m.group(2)
            imp[varname] = f"/images/{slug}/{filename}"
    return imp

def is_import_line(line: str) -> bool:
    """True for any import statement in the body."""
    stripped = line.strip()
    return stripped.startswith("import ") and '"' in stripped

def replace_src_props(line: str, imp: dict[str, str]) -> str:
    """
    Replace src={varname} with src="/images/slug/filename.ext".
    Handles both Figure and Figures children.
    """
    def replacer(m):
        varname = m.group(1)
        if varname in imp:
            return f'src="{imp[varname]}"'
        return m.group(0)  # leave unchanged if not in map
    return re.sub(r'src=\{(\w+)\}', replacer, line)

def parse_figure_props(line: str):
    """
    Extract src, alt, caption from a <Figure ... /> line.
    Returns None if the line is not a Figure element.
    Expects src to already be a string (after replace_src_props).
    """
    stripped = line.strip()
    if not stripped.startswith("<Figure"):
        return None
    props = {}
    # src="..."
    m = re.search(r'src="([^"]+)"', stripped)
    if m:
        props["src"] = m.group(1)
    # alt="..."
    m = re.search(r'alt="([^"]*)"', stripped)
    if m:
        props["alt"] = m.group(1)
    # caption="..."
    m = re.search(r'caption="([^"]*)"', stripped)
    if m:
        props["caption"] = m.group(1)
    return props if "src" in props else None

def build_items_json(figures: list[dict]) -> str:
    """
    Build the items={[...]} JSX prop value.
    Uses double-quote strings inside the array; any literal " in values is escaped.
    """
    parts = []
    for f in figures:
        src = f["src"].replace('"', '\\"')
        alt = f.get("alt", "").replace('"', '\\"')
        if "caption" in f:
            cap = f["caption"].replace('"', '\\"')
            parts.append(f'{{"src":"{src}","alt":"{alt}","caption":"{cap}"}}')
        else:
            parts.append(f'{{"src":"{src}","alt":"{alt}"}}')
    return "[" + ",".join(parts) + "]"

def extract_cols(line: str) -> str:
    """Extract cols value from <Figures cols={2}> or <Figures> (default 2)."""
    m = re.search(r'cols=\{(\d+)\}', line)
    return m.group(1) if m else "2"

def transform_body(body_lines: list[str], imp: dict[str, str]) -> list[str]:
    """
    Apply all body transforms:
    1. Strip import lines
    2. Replace src={varname} with src="..."
    3. Convert <Figures>...</Figures> to <Figures items={[...]} />
    """
    # Step 1+2: strip imports, replace src props
    processed = []
    for line in body_lines:
        if is_import_line(line):
            continue
        processed.append(replace_src_props(line, imp))

    # Step 3: convert Figures blocks
    out = []
    i = 0
    while i < len(processed):
        line = processed[i]
        stripped = line.strip()

        # Detect opening of a Figures block
        if re.match(r'\s*<Figures(\s|>)', stripped) and not stripped.endswith("/>"):
            # It's an opening tag, not self-closing
            cols = extract_cols(stripped)
            figures = []
            i += 1
            # Collect until </Figures>, joining multiline <Figure> elements
            figure_buf = []  # accumulates lines for a multiline Figure
            while i < len(processed):
                inner = processed[i]
                inner_stripped = inner.strip()
                if inner_stripped == "</Figures>":
                    # Flush any pending figure buffer
                    if figure_buf:
                        full = " ".join(figure_buf)
                        props = parse_figure_props(full)
                        if props:
                            figures.append(props)
                        figure_buf = []
                    break
                # Check if this line starts a new Figure element
                if inner_stripped.startswith("<Figure"):
                    # Flush previous buffer if any
                    if figure_buf:
                        full = " ".join(figure_buf)
                        props = parse_figure_props(full)
                        if props:
                            figures.append(props)
                        figure_buf = []
                    figure_buf.append(inner_stripped)
                    # If it self-closes on this line, flush immediately
                    if inner_stripped.endswith("/>"):
                        props = parse_figure_props(" ".join(figure_buf))
                        if props:
                            figures.append(props)
                        figure_buf = []
                elif figure_buf:
                    # Continuation of a multiline Figure element
                    figure_buf.append(inner_stripped)
                    if inner_stripped.endswith("/>"):
                        props = parse_figure_props(" ".join(figure_buf))
                        if props:
                            figures.append(props)
                        figure_buf = []
                i += 1
            # Emit the new self-closing form
            items_json = build_items_json(figures)
            out.append(f"<Figures cols={{{cols}}} items={{{items_json}}} />\n")
        else:
            out.append(line)
        i += 1

    # Drop the blank lines that were only there to separate import statements.
    # Specifically: collapse more than two consecutive blank lines to one.
    result = []
    blank_count = 0
    for line in out:
        if line.strip() == "":
            blank_count += 1
            if blank_count <= 1:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)
    return result

def rewrite_frontmatter_covers(frontmatter: str, slug: str) -> str:
    """
    Replace ../../assets/<slug>/filename in cover/covers YAML values with
    /images/<slug>/filename.
    """
    # Match quoted paths like "../../assets/slug/filename.ext"
    pattern = re.compile(r'(["\']\.\./\.\./assets/[^/]+/)([^"\']+)(["\'])')
    def replacer(m):
        filename = m.group(2)
        quote = m.group(1)[0]  # opening quote char
        # Extract slug from the path
        path_part = m.group(1)  # e.g. "../../assets/ipcc-reports/
        path_slug = re.search(r'assets/([^/]+)/', path_part)
        if path_slug:
            img_slug = path_slug.group(1)
            return f'{quote}/images/{img_slug}/{filename}{quote}'
        return m.group(0)
    return pattern.sub(replacer, frontmatter)

def transform_file(mdx_path: Path):
    """
    Returns (original, transformed) or None if nothing changed.
    """
    slug = slug_from_path(mdx_path)
    content = mdx_path.read_text(encoding="utf-8")

    # Split on frontmatter delimiters.
    # MDX files start with --- and have a closing --- before the body.
    parts = content.split("---", 2)
    if len(parts) < 3:
        print(f"  WARNING: {mdx_path.name} — could not split frontmatter, skipping")
        return None

    _, frontmatter, body = parts
    body_lines = body.splitlines(keepends=True)

    # Build import map from body
    imp = build_import_map(body_lines, slug)

    # Transform frontmatter
    new_frontmatter = rewrite_frontmatter_covers(frontmatter, slug)

    # Transform body
    new_body_lines = transform_body(body_lines, imp)
    new_body = "".join(new_body_lines)

    new_content = f"---{new_frontmatter}---{new_body}"

    if new_content == content:
        return None
    return (content, new_content)

def main():
    mdx_files = sorted(CONTENT_DIR.glob("*.mdx"))
    print(f"Found {len(mdx_files)} .mdx files")
    changed = 0

    for mdx_path in mdx_files:
        slug = slug_from_path(mdx_path)
        print(f"\n{slug}")
        result = transform_file(mdx_path)
        if result is None:
            print("  no changes")
            continue

        original, transformed = result
        changed += 1

        # Count transforms for verification
        orig_lines = original.splitlines()
        new_lines = transformed.splitlines()
        imports_removed = sum(1 for l in orig_lines if is_import_line(l))
        figures_blocks = len(re.findall(r'<Figures\s', transformed))
        print(f"  removed {imports_removed} import lines")
        print(f"  Figures blocks in output: {figures_blocks}")

        if DRY_RUN:
            # Show a short diff of the first 30 changed lines
            import difflib
            diff = list(difflib.unified_diff(
                orig_lines, new_lines, lineterm="",
                n=2, fromfile="original", tofile="transformed"
            ))
            for line in diff[:40]:
                print("  " + line)
            if len(diff) > 40:
                print(f"  ... ({len(diff) - 40} more diff lines)")
        else:
            mdx_path.write_text(transformed, encoding="utf-8")
            print(f"  written")

    print(f"\n{'DRY RUN — ' if DRY_RUN else ''}Done. {changed}/{len(mdx_files)} files changed.")

if __name__ == "__main__":
    main()
