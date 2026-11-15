# Drawing brief — the 3D journal

Everything Uju draws for the book, what each piece is for, and how to hand it
over. Companion to `assets/art/README.md`, which covers the gallery pieces
rather than the interface.

**The principle:** anything that can be drawn, is drawn. Code supplies
structure, motion, state and layout. Her hand supplies every surface.

---

## How to deliver — read once, applies to everything

**Format.** PNG. Transparent background unless the table says "opaque".

**Colour profile: export sRGB, not Display P3.** Procreate defaults to P3 on
newer iPads. A P3 export looks right on the iPad and then renders oversaturated
and shifted in the browser. In Procreate: *Share → PNG* uses the canvas profile,
so set the canvas to sRGB when you create it, or convert before exporting. This
is the single most likely thing to cause a "why does it look different on the
site" moment.

**Don't bake drop shadows.** Tape, stars and stickers all get rotated by code —
a shadow drawn into the file rotates with the art, which puts the light source
in a different place on every piece. Shadows are added in CSS so the light stays
consistent. Draw the white die-cut border *into* the art; leave the shadow out.

**Draw things straight and centred.** Tape goes on horizontal, stars go on
upright. Code does the rotation, and it varies each one so nothing repeats.
Leave a little empty margin around the edge so rotation doesn't clip a corner.

**The page aspect ratio is 37 : 50.** Anything that fills a whole page — the
covers, the page stock — must be drawn at that ratio or it will stretch. The
sizes in the table already are.

**Naming.** Lowercase, hyphens, two-digit numbers for variants:
`tape-01.png`, `star-03.png`, `heading-case-studies.png`.

**Where to put them.** `~/Desktop/journal-assets-inbox/` — just drop PNGs in and
say the word. They get compressed and moved into `assets/ui/` from there. Keep
the `.procreate` files wherever you like; they never go in the repo, same rule
as `assets/art/_originals/`.

**Sizes are ~2–3× display size** so they stay sharp on a retina screen and can
be downscaled. Bigger than needed is fine; smaller can't be fixed.

---

## Batch 1 — start here

Small, repeatable, no text, and certain regardless of how any page lays out.
Nothing in the build is waiting on a layout decision for these.

| Asset | Size | How many | Notes |
|---|---|---|---|
| `tape-NN.png` | 600 × 200 | 6–8 | Washi strips. **Draw horizontal.** Ragged or torn ends, not clean rectangles — the torn end is what makes it read as tape. Vary colour and pattern across the set; include 2–3 plain and 2–3 patterned. Draw the translucency you actually want, since what you export is what lands on the page. |
| `star-NN.png` | 300 × 300 | 5–6 | The yellow foam stars. **Draw upright.** Give them thickness — a darker edge on one side reads as foam rather than a flat shape. Vary the point lengths so they're visibly siblings, not copies. |
| `mark-NN.png` | 600 × 600 | 10–15 | The annotation layer: arrows, underlines, circles, swirls, hearts, asterisks, little squiggles. Draw in final palette colours — these can't be recoloured in code. This is the batch that makes the site feel drawn rather than laid out, so it's worth more than its size suggests. |

---

## Batch 2 — lettering

Fixed content, fixed size, no layout dependency. Also safe to start now.

| Asset | Size | How many | Notes |
|---|---|---|---|
| `heading-*.png` | 1200 × 400 | 6 | `about-me`, `case-studies`, `experience`, `skills`, `art`, `contact`. **Draw all six on the same canvas size with the same letter height** — roughly 55–65% of the canvas — so they come out as a consistent set without me rescaling them. Dark ink. |
| `wordmark.png` | 900 × 300 | 1 | "Uju Duru" for the top bar. Replaces the Rock Salt webfont the site uses now. |
| `tab-*.png` | 400 × 160 | 5 | The fore-edge bookmarks — see the open question below before drawing these. |

---

## Batch 3 — the big surfaces

These are the hero pieces. More work each, but all five are certain.

| Asset | Size | Opaque? | Notes |
|---|---|---|---|
| `cover-front.png` | 1600 × 2160 | opaque¹ | **The hero.** Your sketch is already the design. Letter "Uju Duru" into it — that lettering is the most characterful part and shouldn't be a webfont. **Leave a clear horizontal band under the title for the role line**, which stays live text so it can change without a redraw (the UX-Engineer-vs-software-engineering question is still open, and you shouldn't have to repaint a cover to settle it). Keep anything important out of the outer ~6%: that's where the rounded corner, the edge and the sheen sit. |
| `cover-back.png` | 1600 × 2160 | opaque¹ | Carries Contact. **Leave a clear area roughly centred** for the email / LinkedIn / GitHub links, which are live text and must stay selectable and clickable. |
| `spine.png` | 150 × 2000 | opaque¹ | Seen edge-on when the book is shut. Narrow, so don't put detail in it that won't survive. |
| `fore-edge.png` | 200 × 2000 | opaque | The stacked page-edges on the open side of the block. This is what sells the thickness — currently faked with CSS stripes and it's the weakest part of the greybox. |
| `page-NN.png` | 1400 × 1890 | opaque | 2–3 cream paper variants so facing pages don't look identical. **Keep these very low contrast** — text sits directly on them, and a busy paper makes the whole site unreadable. Grain and a faint tone shift, nothing more. |

¹ Opaque **only if the covers stay painted edge to edge.** If the book
becomes leather-bound, these three become transparent overlays instead and get
a lot smaller to draw — see the open question below.

---

## Settled — the cover is textured, and you bake the texture in

Decided 2026-11-14 from the cover sketch. Two earlier assumptions in this file
were wrong and are corrected here.

**The ground is terracotta, not oxblood.** The leather reference that started
this was deep burgundy; the actual cover is warm vermilion `#C4472B`, and the
marks on it are sage, tan, teal and mauve — all *lighter* than the ground. So
the "dark ink disappears on a dark cover" problem does not arise, and the
cream paper plate that was recommended to dodge it is not needed. The white
patch behind the title already does that job, as paint rather than paper.

**Bake the grain into the artwork in Procreate — do not ship a separate
leather tile.** This is a hard technical constraint, not a preference.
Grain that reads *through* drawn marks means a `multiply` or `overlay` layer
on top, and `mix-blend-mode` is one of the properties that forces
`transform-style` back to flat and collapses the 3D book. Stacked background
layers can only put the leather *under* the marks, where grain shows around
them but never through them — which is backwards, since the strokes in the
sketch have tooth in them.

In Procreate it is a texture layer and a blend mode: one step, visible as you
work, and you control how much. The only thing given up is recolouring the
cover from code, which is moot now the scheme is settled.

**Use the same texture source on every bound surface** — front, back, spine
and fore-edge — or the book looks assembled from different materials.

So the Batch 3 covers stay exactly as first written: **opaque, full bleed, the
whole design.** No `leather.png`, no transparent overlay, no `cover-plate.png`.

### Palette, confirmed against the sketch

| | | |
|---|---|---|
| ground | `#8DA6B3` | the surface the book sits on |
| cover | `#C4472B` | |
| page | `#FBF7F0` | |
| sage | `#8FB98C` | |
| tan | `#B99E7C` | |
| teal | `#9CCAC6` | |
| mauve | `#B07BA6` | |

### One thing the sketch does not answer

The cover reads **"UJU'S JOURNAL"**, which is the title, not your name and
role. The plan asks the cover to do real work — someone should know whose site
this is and what you do before they click anything, since it is the only thing
on screen until they open it. "UJU'S JOURNAL" gives a first name.

Two ways out, both fine, but one needs deciding before the cover is painted:
leave a clear horizontal band for a live-text role line (as the Batch 3 row
says), or let the top bar carry name and role and keep the cover purely as an
object. The second is more honest to the sketch; it just means the bar has to
be more present than a quiet wordmark.

Note the cover title and `wordmark.png` are different assets. The title is
painted into `cover-front.png`; the wordmark is the bar, and currently says
"Uju Duru".

---

## Batch 4 — hold until the layouts exist

Don't draw these yet. They need real measurements, and drawing them to guessed
sizes means drawing them twice.

| Asset | Size | How many | Notes |
|---|---|---|---|
| `panel-NN.png` | 800 × 800 | 4–6 | Patterned-paper panels — your gingham / stripe / plaid equivalents in your palette. Used at panel size, so they don't need to tile seamlessly. |
| `frame-*.png` | 900 × 900 | 3–4 | The white die-cut border look. Must be drawn as **separable pieces** (left end, middle, right end) so the middle can stretch — a frame drawn to fit "Case Studies" distorts the moment it holds "Experience & Skills". |
| `spot-NN.png` | 1000 × 1000 | 3–5 | Spot illustrations for Experience, per the "emojis or drawing related" note on your sketch. |

---

## Two costs of drawing everything

1. **Lettering is an image, so every heading needs a hidden real-text twin**
   (`sr-only`) for screen readers and search, and can't be restyled or
   translated without redrawing. Worth it for six headings and a wordmark; it
   is why body copy stays live text.
2. **Weight.** Each file is small; forty of them are not. They get compressed
   through the same `sips` pipeline as `assets/art/`, and the total is checked
   before launch.

---

## Open question — how many tabs?

The plan said tabs are one per spread (3: Case Studies, Experience, Art), with
About and Contact reached from the wordmark bar. The greybox gives all **five**
sections a tab, and it navigates noticeably better — every section is one click
from anywhere, which is what "easy to navigate" actually means.

Five tabs means five `tab-*.png` files instead of three. Worth deciding before
Batch 2 is drawn.
