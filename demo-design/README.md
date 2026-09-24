# demo-design/

Reference pictures for each design style. One folder per style, named with the same slug
as its guide in `design-guide/`. The slug list lives in `design-guide/styles.json`.

```
demo-design/
  swiss-design/
    sources.md          ← where each picture came from (fill this in)
    01-full-page.jpg
    02-hero.jpg
    03-type-detail.jpg
  y2k/
  glass-morphism/
```

## Who reads these

- **You**, picking a style for a project.
- **Later (V2.6)**, the multimodal compiler: these become vision input, so a style can be
  chosen by example rather than by name.
- **Visual QA**, as the "this is what it should feel like" reference beside the built page.

## Adding pictures to a style

1. Drop image files into the style's folder. Prefer `.jpg`/`.png`/`.webp`, under ~1 MB each.
2. Name them `NN-short-description.ext`, numbered in the order you want them viewed:
   `01-full-page.jpg`, `02-hero.jpg`, `03-nav-detail.jpg`.
3. Aim for **3–6 pictures**: at least one full-page shot, one hero/above-the-fold, and one
   close detail (type, buttons, spacing). Full pages matter more than pretty crops.
4. Add a row to that folder's `sources.md` for each file.

## Adding a new style

1. Set its entry in `design-guide/styles.json` to `"status": "ready"` (or add the entry).
2. Write `design-guide/<slug>.md` (copy the shape of an existing guide).
3. Create `demo-design/<slug>/` with a `sources.md`, then add pictures.

Folders are created when a guide is written, not up front — an empty folder per style is
just noise.

## Rights

The repo is private, so saved references are fine here. If Weave is ever made public,
anything here without clear redistribution rights has to come out first — that's what
`sources.md` is for.
