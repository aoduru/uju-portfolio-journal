# Art pipeline

Originals go in `_originals/` (on disk, **not committed** — keep your own backups
in Procreate or wherever you drew them). Everything the site serves is generated:

```
_originals/   what you drop in, any size
display/      1600px max, JPEG q82 — what a viewer opens
thumb/        600px max, JPEG q78 — the grid
manifest.json the list the gallery reads
```

18 pieces: 45MB of originals became 2.5MB of web files, and the whole gallery
loads as 433KB of thumbnails.

## Adding new pieces

Drop them in `_originals/` and re-run the pipeline. It reads every png/jpeg
there, honours phone rotation from EXIF, and rewrites `manifest.json`.

## The one thing only you can do

Every entry in `manifest.json` has an empty `title`. They are all currently
called things like `untitled-artwork-12`. Titles become the captions and the alt
text, so they matter for anyone using a screen reader and for anyone deciding
whether you can draw. Fill them in — a few words each is plenty.

```json
{ "slug": "untitled-artwork-12", "title": "", ... }
```
