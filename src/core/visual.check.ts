// ponytail: runnable check for hybrid visual QA (fakes — no vision model / browser).

import assert from "node:assert/strict";
import { FakeDecision } from "./decision/providers.js";
import { visualQA } from "./visual.js";
import type { VisionExtractor, VisionReinspector } from "./visual.js";

const extractor: VisionExtractor = {
  async extract() {
    return { heroVisible: true, ctaClickable: true };
  },
};
const criteria = [
  { id: "hero_visible", description: "hero is visible" },
  { id: "cta_clickable", description: "CTA is clickable" },
];

// High confidence → accept, no re-check needed.
const confident = await visualQA({
  screenshotPath: "/tmp/x.png",
  criteria,
  extractor,
  decision: new FakeDecision(() => ({ value: "pass", confidence: 0.95 })),
});
assert.equal(confident.ok, true);
assert.equal(confident.results[0]!.escalation, "accept");

// Low confidence → deliberate reinspector decides (here it overrides to pass).
let reinspected = 0;
const reinspector: VisionReinspector = {
  async reinspect() {
    reinspected++;
    return { ok: true };
  },
};
const shaky = await visualQA({
  screenshotPath: "/tmp/x.png",
  criteria,
  extractor,
  decision: new FakeDecision(() => ({ value: "fail", confidence: 0.4 })),
  reinspector,
});
assert.equal(reinspected, 2); // both criteria were low-confidence → re-checked
assert.equal(shaky.ok, true); // reinspector overrode to pass

console.log("visual QA check passed");
