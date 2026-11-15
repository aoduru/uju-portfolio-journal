# Leather grain

`leather-grain-1024.png` — a seamless grayscale bump map, generated. Used in
Procreate to give the cover artwork the texture of hide. Not a shipped asset:
the grain is baked into `cover-front.png` and friends before export, because
`mix-blend-mode` would collapse the book's `preserve-3d`.

**How to use it.** Insert over the flat cover colour, set the layer to a
Clipping Mask so it cannot spill, blend mode **Overlay** (or Soft Light),
opacity **18–30%**. Keep it BELOW the scribbles — grain belongs to the hide,
the marks sit on top of it. Same tile, same scale, same opacity on the back
cover and spine, or the book looks made of two materials.

**It is mean-127 on purpose.** Tonally neutral, so on Overlay it contributes
bumps and never a colour cast or a shift in value: `#C4472B` stays `#C4472B`.

**It tiles.** `leather-grain-2048.png` is this same file tiled 2x2 -- identical
pixels, nothing recomputed -- for when a single larger file is less fiddly than
stacking layers. Tile further for any size needed, at native resolution. There
is no reason to scale it up.

**Do not regenerate at a larger N to get a bigger tile.** It will not match.
Changing N changes the warp frequency relative to cell size and the lighting
gradient's falloff per pixel, so the pebbles come out rounder, more regular
and flatter -- a different texture wearing the same parameters. Tile instead.

## Why generated rather than downloaded

Nothing to license, and it stays tunable — pebble size, crease depth and
contrast are numbers in `generate.py`, so a change later is a re-run rather
than a new search. The alternative considered was ambientCG's Leather028
(CC0, photographic, and its Displacement map would serve the same role).

## Tuning

`python3 -I generate.py`. The parameters that matter:

| | |
|---|---|
| cell count in the first `cellular()` | pebble size — more cells, finer grain |
| `crease` divisor | crease width; narrower reads as cracked glaze |
| `crease` / `dome` / `swell` weights | crease-led or bump-led |
| `LX, LY` | light direction |
| the `0.150` in the normalise step | contrast |

**If you change `N`, scale `warp` with it.** `warp` is in normalised units, so
quadrupling the cell count halves the cell size and an unchanged warp then
displaces each cell by more than its own width — which smears the pebbles into
worms. That is what went wrong on the first 2048 attempt.
