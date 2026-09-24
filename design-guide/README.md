# design-guide/

One file per design style: `design-guide/<slug>.md`. The agent reads it before building,
and Weave checks the built page against it afterwards. A guide that can't be checked is
just vibes, so every guide ends with concrete rules.

```
design-guide/
  README.md        ← this file
  styles.json      ← the canonical slug list (89 styles, all written)
  _base.md         ← the floor every style inherits (accessibility, responsive, perf)
  swiss-design.md
  y2k.md
  … 87 more
```

Pictures for each style live in `demo-design/<slug>/`, under the same slug.

## Anatomy of a guide

**YAML frontmatter** — machine-readable, feeds the Design IR and the MCP preset list:

| Key | Meaning |
|---|---|
| `slug` | Folder-safe id. Must match `styles.json` and the `demo-design/` folder. |
| `title`, `aliases` | Display name, plus other names people use for it. |
| `status` | `ready` (written + checked), `draft` (written, unverified), `stub` (name only). |
| `summary` | One line, shown when picking a style. |
| `best_for` / `avoid_for` | Where the style earns its keep, and where it fights the product. |
| `inherits` | Always `_base.md` for now. |
| `tokens` | The actual design decisions: colours, typography, layout, shape, motion, imagery. |
| `checks` | Rules Weave verifies on the built page. Each has an `id`, a `rule`, and a `kind`. |
| `overrides` | Optional. A `_base.md` rule this style is allowed to break, with the reason and a `compensating_check` that protects the rule's intent. Only `maximalism` uses one today (3 font families, with a payload budget in exchange). |
| `combination` | Optional. Marks a treatment that layers over another style, and lists what it changes. The four combination entries use it. |
| `variants` | Optional. Named readings of one style that share its discipline but change the ground — `minimalism` has light, true-dark, grain and soft-gradient. A run declares which variant it is building, and checks carrying `applies_to` are filtered to it. |

**Prose body** — what the tokens can't carry: how the style behaves, component treatments,
and the do/don't list. Written for an agent to follow literally.

### Check kinds

- `deterministic` — measurable from the built CSS/DOM or a headless browser. No judgment.
  Example: every computed `border-radius` is `0px`.
- `judged` — needs a model looking at a screenshot. Example: "the composition feels
  asymmetric but balanced". Keep these few; they cost money and can be wrong.

Check ids are namespaced by slug (`swiss.shape.radius-zero`) so results stay traceable in
evidence.

## How tokens map to the Design IR

`tokens.colors`, `tokens.typography` and `tokens.layout` line up with `DesignIR` fields in
`src/core/ir/schema.ts` today. `tokens.shape`, `tokens.motion` and `tokens.imagery` have no
IR home yet — the IR has no radius, shadow, spacing or motion tokens. Extending the schema
for those is V2.6 work; until then these keys are read by the guide, not by the compiler.

## When pictures and a guide disagree

The guide is the spec. If reference pictures contradict it, the pictures get re-filed and the
mismatch is recorded in that folder's `sources.md` — the guide is not quietly rewritten to match
whatever was collected. Two deliberate exceptions have been made so far, both after reviewing
real references: `ascii-art` was rewritten (and `terminal-ui` split out of it), and `minimalism`
gained variants.

A third change came from the same review: six references filed under `maximalism` shared a
pattern no guide covered — one loud colour, poster-scale type, cut-out imagery on cream, visible
grid. That became `bold-editorial`, and the references moved with it. Adding a style is the
right response when references cluster around something the set genuinely lacks; rewriting an
existing guide to absorb them is not.

## Adding a style

1. Flip its `status` in `styles.json` (or add the entry, keeping the slug kebab-case).
2. Copy an existing guide, replace tokens, rewrite the prose, and make the checks specific
   to this style — a guide whose checks are all generic isn't describing a style.
3. Create `demo-design/<slug>/sources.md` and add reference pictures.

## Validating

```bash
node scripts/check-design.mjs
```

Checks that every slug matches its filename and manifest entry, required frontmatter keys and
prose sections are present, hex values are valid, check ids are namespaced and unique, each
style has at least 6 checks and a picture folder, and no stray non-Latin characters crept in
from a bad paste. It catches mechanical breakage only — whether a guide actually describes its
style is a reading job.
