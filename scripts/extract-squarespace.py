"""Extract copy and images, in document order, from a Squarespace project page."""
import re, sys, json
from html.parser import HTMLParser
from html import unescape

class Extract(HTMLParser):
    TEXT = {"h1","h2","h3","h4","p","li","figcaption","blockquote"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out=[]; self.stack=[]; self.buf=[]; self.cur=None
        self.skip=0; self.inline=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ("script","style","noscript","svg"): self.skip+=1; return
        if self.skip: return
        if tag=="img":
            src=a.get("data-src") or a.get("src") or ""
            # widest candidate in srcset wins
            best=None
            for cand in (a.get("data-srcset") or a.get("srcset") or "").split(","):
                cand=cand.strip()
                m=re.match(r'(\S+)\s+(\d+)w$', cand)
                if m and (best is None or int(m.group(2))>best[1]):
                    best=(m.group(1), int(m.group(2)))
            self.out.append({"type":"img","src":src,"best":best[0] if best else src,
                             "w":best[1] if best else None,"alt":a.get("alt","")})
            return
        if tag in self.TEXT and self.cur is None:
            self.cur=tag; self.buf=[]
        elif self.cur and tag in ("em","i"): self.buf.append("__EM__")
        elif self.cur and tag in ("strong","b"): self.buf.append("__ST__")
        elif tag=="br" and self.cur: self.buf.append("\n")
    def handle_endtag(self, tag):
        if tag in ("script","style","noscript","svg"):
            self.skip=max(0,self.skip-1); return
        if self.skip: return
        if tag in ("em","i") and self.cur: self.buf.append("__EM__")
        elif tag in ("strong","b") and self.cur: self.buf.append("__ST__")
        elif tag==self.cur:
            t="".join(self.buf)
            t=re.sub(r'[ \t]+',' ',t).strip()
            if t: self.out.append({"type":self.cur,"text":t})
            self.cur=None; self.buf=[]
    def handle_data(self, d):
        if self.skip: return
        if self.cur is not None: self.buf.append(d)

src=open(sys.argv[1]).read()
m=re.search(r'<article.*?</article>', src, re.S)
body=m.group(0) if m else src
p=Extract(); p.feed(body)
json.dump(p.out, open(sys.argv[2],"w"), indent=1, ensure_ascii=False)
print(f"{len(p.out)} nodes -> {sys.argv[2]}")
print("  text:", sum(1 for n in p.out if n['type']!='img'), "| images:", sum(1 for n in p.out if n['type']=='img'))
