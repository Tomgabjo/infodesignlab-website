#!/usr/bin/env python3
"""
Rewrite the `items` prop on <Figures ... items={[...]} /> blocks from
JSON-style quoted object keys to JS-style unquoted keys, so TinaCMS's MDX
rich-text parser can match the Figures template's `items` (object list)
field against the real content.

Before: items={[{"src":"/images/x/1.jpg","alt":"...","caption":"..."}]}
After:  items={[{src:"/images/x/1.jpg",alt:"...",caption:"..."}]}

Only the three known keys (src, alt, caption) are unquoted — nothing else
in the file is touched. Values themselves (the strings after the colon)
are left exactly as-is, quotes and all, since those are legitimate JS
string literals either way.

Verifies before/after: total <Figures ...> match count is unchanged per
file, and no `"src":`, `"alt":` or `"caption":` (quoted-key form) remains
in any Figures items block afterward.
"""

import re
import sys
from pathlib import Path

content_dir = Path(__file__).parent.parent / "src" / "content" / "case-studies"

KEY_PATTERN = re.compile(r'"(src|alt|caption)":')

def transform_line(line: str) -> tuple[str, int]:
    """Unquote src/alt/caption keys only within a <Figures ... items={[...]} /> tag."""
    if "<Figures" not in line or "items=" not in line:
        return line, 0
    new_line, n = KEY_PATTERN.subn(r"\1:", line)
    return new_line, n

def main():
    total_files = 0
    total_replacements = 0
    errors = []

    for path in sorted(content_dir.glob("*.mdx")):
        text = path.read_text()
        lines = text.split("\n")

        figures_before = sum(1 for l in lines if "<Figures" in l)

        new_lines = []
        file_replacements = 0
        for line in lines:
            new_line, n = transform_line(line)
            new_lines.append(new_line)
            file_replacements += n

        if file_replacements == 0:
            continue

        new_text = "\n".join(new_lines)
        figures_after = sum(1 for l in new_lines if "<Figures" in l)

        if figures_before != figures_after:
            errors.append(f"{path.name}: Figures tag count changed ({figures_before} -> {figures_after})")
            continue

        # Sanity: no quoted src/alt/caption keys should remain
        if KEY_PATTERN.search(new_text):
            remaining = KEY_PATTERN.findall(new_text)
            errors.append(f"{path.name}: {len(remaining)} quoted key(s) still remain after transform")
            continue

        path.write_text(new_text)
        total_files += 1
        total_replacements += file_replacements
        print(f"  {path.name}: {file_replacements} keys unquoted")

    if errors:
        print("\nERRORS — no files were left partially written:", file=sys.stderr)
        for e in errors:
            print(f"  {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\nDone: {total_files} files changed, {total_replacements} keys unquoted total.")

if __name__ == "__main__":
    main()
