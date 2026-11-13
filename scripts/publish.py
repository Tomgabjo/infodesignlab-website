#!/usr/bin/env python3
"""
Publishing kit for the agent-centric editing flow (no CMS).

Tom sends text and images; the agent uses these commands to write the files,
then shows the change and publishes after his approval.

  python3 scripts/publish.py event --title "..." --date 2026-11-20 \
      --where "Venue, City" [--date-label "20 Nov 2026"] [--href URL] \
      [--kind talk|workshop|conference|lecture] [--image path/to/file]

  python3 scripts/publish.py publication --title "..." --publisher "..." \
      [--date 2026-05-01] [--date-label "2026"] [--href URL] \
      [--author "Angela Morelli" --author "Tom Gabriel Johansen"]

  python3 scripts/publish.py image path/to/file --folder <slug>
      Copies an image into public/images/<folder>/ with the extension taken
      from its real bytes (Squarespace and phones often mislabel WebP/HEIC).

  python3 scripts/publish.py check
      astro check + astro build + the post-build checks this site has needed
      (missing spaces before inline bold, stray Cloudflare email obfuscation).

Every write refuses to overwrite an existing file and warns about likely
duplicates. Strings are written as JSON-quoted YAML, which is always valid
YAML, so quotes inside citations cannot break the frontmatter.
"""
from __future__ import annotations
import argparse, json, re, shutil, subprocess, sys, unicodedata
from datetime import date
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content"
IMAGES = ROOT / "public" / "images"
KINDS = ["talk", "workshop", "conference", "lecture"]


def slugify(text: str) -> str:
    t = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()
    return re.sub(r"-{2,}", "-", t)[:80].rstrip("-")


def q(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def real_ext(path: Path) -> str:
    head = path.read_bytes()[:16]
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return ".webp"
    if head[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if head[:4] in (b"GIF8",):
        return ".gif"
    if head[4:12] in (b"ftypavif",):
        return ".avif"
    if head[4:8] == b"ftyp":
        sys.exit(f"{path.name} looks like HEIC/HEIF. Convert to JPG or WebP first.")
    if path.suffix.lower() == ".svg":
        return ".svg"
    sys.exit(f"Unrecognised image format: {path}")


def frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---", text, re.S)
    out = {}
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            if v and not line.startswith(" "):
                out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def warn_duplicates(folder: Path, title: str, when: str | None):
    hits = []
    for f in folder.glob("*.md*"):
        fm = frontmatter(f)
        ratio = SequenceMatcher(None, fm.get("title", "").lower(), title.lower()).ratio()
        same_month = when and fm.get("date", "")[:7] == when[:7]
        if ratio > 0.6 or (same_month and ratio > 0.35):
            hits.append((round(ratio, 2), f.name, fm.get("title"), fm.get("date")))
    for h in sorted(hits, reverse=True)[:5]:
        print(f"  POSSIBLE DUPLICATE  {h[1]}  {h[2]!r}  {h[3] or ''}  (similarity {h[0]})")
    return bool(hits)


def write_new(path: Path, body: str):
    if path.exists():
        sys.exit(f"Refusing to overwrite {path.relative_to(ROOT)}")
    path.write_text(body, encoding="utf-8")
    print(f"WROTE  {path.relative_to(ROOT)}")
    print(body)


def copy_image(src: str, folder: str, stem: str | None = None) -> str:
    p = Path(src).expanduser()
    if not p.is_file():
        sys.exit(f"No such image: {src}")
    dest_dir = IMAGES / folder
    dest_dir.mkdir(parents=True, exist_ok=True)
    name = (stem or slugify(p.stem) or "img") + real_ext(p)
    dest = dest_dir / name
    if dest.exists():
        sys.exit(f"Refusing to overwrite {dest.relative_to(ROOT)}")
    shutil.copyfile(p, dest)
    url = f"/images/{folder}/{name}"
    print(f"IMAGE  {dest.relative_to(ROOT)}  ->  {url}")
    return url


def cmd_event(a):
    date.fromisoformat(a.date)  # validates
    slug = a.slug or slugify(f"{a.title}-{a.date[:4]}")
    print("Checking for duplicates in src/content/events ...")
    warn_duplicates(CONTENT / "events", a.title, a.date)
    lines = ["---", f"title: {q(a.title)}", f"date: {a.date}"]
    if a.date_label:
        lines.append(f"dateLabel: {q(a.date_label)}")
    lines.append(f"where: {q(a.where)}")
    if a.href:
        lines.append(f"href: {q(a.href)}")
    lines.append(f"kind: {q(a.kind)}")
    if a.image:
        lines.append(f"image: {q(copy_image(a.image, 'events', slug))}")
    lines += ["---", ""]
    write_new(CONTENT / "events" / f"{slug}.md", "\n".join(lines))


def cmd_publication(a):
    if a.date:
        date.fromisoformat(a.date)
    if a.href and not re.match(r"https?://", a.href):
        sys.exit("--href must be a full http(s) URL (the schema requires it).")
    slug = a.slug or slugify(a.title)
    print("Checking for duplicates in src/content/publications ...")
    warn_duplicates(CONTENT / "publications", a.title, a.date)
    lines = ["---", f"title: {q(a.title)}", f"publisher: {q(a.publisher)}"]
    if a.date:
        lines.append(f"date: {a.date}")
    if a.date_label:
        lines.append(f"dateLabel: {q(a.date_label)}")
    if a.href:
        lines.append(f"href: {q(a.href)}")
    if a.author:
        lines.append("authors:")
        lines += [f"  - {q(n)}" for n in a.author]
    lines += ["draft: false", "---", ""]
    write_new(CONTENT / "publications" / f"{slug}.md", "\n".join(lines))


def cmd_image(a):
    copy_image(a.path, a.folder, a.name)


def cmd_check(_a):
    for step in (["npx", "astro", "check"], ["npx", "astro", "build"]):
        print("RUN   ", " ".join(step))
        r = subprocess.run(step, cwd=ROOT, capture_output=True, text=True)
        tail = (r.stdout + r.stderr).strip().splitlines()[-6:]
        print("\n".join("      " + t for t in tail))
        if r.returncode:
            sys.exit(f"FAILED: {' '.join(step)}")
    pages = list((ROOT / "dist").rglob("index.html"))
    problems = []
    for f in pages:
        html = f.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"[a-z]<b>[a-z]|[a-z]</b>[a-z]", html):
            problems.append(f"missing space around <b> in {f.relative_to(ROOT)}")
        if "cdn-cgi" in html or "__cf_email__" in html:
            problems.append(f"Cloudflare email obfuscation in {f.relative_to(ROOT)}")
    print(f"PAGES  {len(pages)} built")
    for p in problems:
        print("WARN  ", p)
    print("OK" if not problems else "CHECK THE WARNINGS ABOVE")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    e = sub.add_parser("event")
    e.add_argument("--title", required=True)
    e.add_argument("--date", required=True, help="YYYY-MM-DD; first of the month if only a month is known")
    e.add_argument("--date-label")
    e.add_argument("--where", required=True)
    e.add_argument("--href")
    e.add_argument("--kind", choices=KINDS, default="talk")
    e.add_argument("--image")
    e.add_argument("--slug")
    e.set_defaults(fn=cmd_event)

    p = sub.add_parser("publication")
    p.add_argument("--title", required=True)
    p.add_argument("--publisher", required=True)
    p.add_argument("--date")
    p.add_argument("--date-label")
    p.add_argument("--href", help="Only a URL confirmed against the publisher. Omit if unconfirmed.")
    p.add_argument("--author", action="append")
    p.add_argument("--slug")
    p.set_defaults(fn=cmd_publication)

    i = sub.add_parser("image")
    i.add_argument("path")
    i.add_argument("--folder", required=True, help="e.g. a case-study slug or 'events'")
    i.add_argument("--name", help="file stem; default is the slugified original name")
    i.set_defaults(fn=cmd_image)

    c = sub.add_parser("check")
    c.set_defaults(fn=cmd_check)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
