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

## Open question — is the book leather-bound?

Raised 2026-11-14 with a reference: deep oxblood, fine pebbled grain, matte.

**If yes, don't draw the leather.** It is the one thing on the whole list that
is better not hand-drawn. Pebbled grain is uniform high-frequency noise — the
thing a hand adds least character to and spends the most time on, and any
unevenness reads as a mistake rather than as craft. It is a *material*, not a
mark. Everything else on this list is a mark.

So leather would be a tiling texture (one `leather.png`, ~800 × 800, seamless),
and **what you draw sits on top of it**:

| | Covers stay painted | Covers go leather |
|---|---|---|
| `cover-front.png` | opaque, full bleed, the entire design | **transparent** — ornament and lettering only |
| `cover-back.png` | opaque, full bleed | **transparent** — ornament only |
| `spine.png` | opaque | **transparent**, or dropped entirely |
| new | — | `leather.png`, one seamless tile, not drawn by you |

The leather version is **much less painting** and the grain stays identical
across front, back and spine for free. It also means the cover colour becomes a
variable — the leather can be recoloured without repainting anything.

Three things to know before deciding:

1. **Sourcing.** The reference is someone else's photograph, so it can't go on
   a public site as-is. Either a CC0 texture (Poly Haven, ambientCG) or a
   generated seamless tile. Not a blocker, but it is a real step.
2. **It must be a `background-image` layer.** Not `mix-blend-mode`, not an SVG
   filter — each of those forces `transform-style` back to flat and collapses
   the 3D book. Stacked background layers are fine, so
   `ornament, leather, sheen` composite in one declaration.
3. **Leather commits the cover to being dark** — see the next section, which
   is the real consequence and the thing to decide first.

### Where the cover drawings go, if it is leather

Confirmed 2026-11-14: the cover carries hand-drawn scribbles and sketches
either way. That is not in question. *How they sit on dark leather* is.

Everything drawn for this site so far is dark ink and colour on cream. On an
oxblood ground that disappears. Three options:

| | What it means | Cost |
|---|---|---|
| Light media on leather | Gold / cream / white line work straight onto the hide. Reads as gilt. | A new technique, and gold is unforgiving drawn flat. |
| Blind deboss | Drawings pressed *into* the leather, same colour, read by shadow only. | A lighting effect rather than a drawing; has to be baked in. |
| **A paper plate tipped on** | Your drawings on a cream panel with the white die-cut border, glued or taped onto the leather. | **None — this is already your language.** |

**The plate is the recommendation.** It is not a compromise, it is the move in
every one of the nine reference photos: cut paper with a white border and a
small hard shadow, sitting on a ground, often held with washi tape. The leather
becomes the ground. The drawing stays on cream where the ink works, the tape
and the die-cut border stay, and the book is still leather-bound.

It composes, too — a tipped-on plate for the cover art *plus* a little light
lettering directly on the hide for the name is what real bound books do.

On the plate route the cover assets become:

| Asset | Size | Opaque? | Notes |
|---|---|---|---|
| `leather.png` | 800 × 800 | opaque | One seamless tile. Not drawn by you. |
| `cover-plate.png` | 1200 × 1500 | opaque | The cover drawing, on cream, drawn exactly how you already draw. Include the white die-cut border. **Not** the 37:50 page ratio — this is a panel sitting on the cover, so its proportions are yours to choose. |
| `cover-marks.png` | 1600 × 2160 | transparent | *Optional.* Light-media marks that sit directly on the hide around the plate. 37:50. |
| `cover-back.png` | 1600 × 2160 | transparent | Ornament only, over the leather. |

**One exception to the no-baked-shadows rule.** The plate gets a small hard
drop shadow, and unlike tape and stars it may be drawn in. Tape and stars are
rotated to random angles by code, so a baked shadow puts the light source
somewhere different on every piece. A cover plate is fixed on a fixed cover —
the light never moves relative to it.

**Timing: this is phase 2, with the rest of Batch 3 — not now.** The greybox is
grey deliberately. Dropping one real material into it makes everything beside
it look broken, which wrecks the only thing it is for, which is judging motion.
And the texture has to be tuned against the final palette, which does not exist
yet.

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
