# Uju Portfolio Journal

A portfolio built as a top-bound spiral sketchbook. Pages turn in 3D; the cover
carries About Me and each section is its own sheet in the pad.

## Running it

Any static server from the project root:

```bash
python3 -m http.server 8940
```

Then open <http://localhost:8940>.

## How it is put together

| Path | Role |
|---|---|
| `index.html` | markup, nav, and the SVG wobble filters the coils are drawn with |
| `css/journal.css` | the 3D stage, the band chain, paper and type |
| `js/bookEngine.js` | turn geometry, history, keyboard / wheel / touch input |
| `js/main.js` | draws the spiral, builds the paper bands, wires the nav |

### Notes for future edits

- **Pages rotate on a positive `rotateX`.** A page hinged at the top must swing
  its free edge *toward* the viewer. Negative sends it behind the stack, where
  perspective shrinks it and the turn reads as a flat vertical squash.
- **Paper bends via nested bands.** No single element can curve, so each face's
  paper is six bands, each hinged at the bottom of the one above. `--curl` is
  the total degrees of bend; per-band `--w` weights share it out.
- **Nothing in the band chain may carry `filter`, `mix-blend-mode`,
  `opacity < 1`, `clip-path` or `overflow`.** Each of those forces
  `transform-style` back to `flat` and collapses the bend. Clipping lives on
  `.face__flat` instead.
- **`backface-visibility` does not cull children inside `preserve-3d`.** Every
  band sets its own, or the back face renders through the front.
- **SVG filters set `color-interpolation-filters="sRGB"`.** The `linearRGB`
  default leaves transparent pixels faintly opaque and paints each filter
  region as a visible box.
