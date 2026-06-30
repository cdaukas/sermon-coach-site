import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EvaluationDashboard } from "../src/components/evaluation/EvaluationDashboard";
import {
  EVALUATION_FIXTURE,
  EVALUATION_FIXTURE_PROMPT_VERSION,
} from "../src/lib/evaluation/fixture";
import {
  evaluationResultStrictSchema,
  formatScoreBandStrict,
  parseEvaluationResult,
} from "../src/lib/evaluation/schema";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Stub path inserts EVALUATION_FIXTURE with formatScoreBandStrict(scoring).
evaluationResultStrictSchema.parse(EVALUATION_FIXTURE);

const parsed = parseEvaluationResult(EVALUATION_FIXTURE, {
  promptVersion: "fixture-v1",
});
assert(parsed, "parseEvaluationResult returned null for fixture");

const scoreBand = formatScoreBandStrict(EVALUATION_FIXTURE.scoring);
assert(scoreBand === "Strong · Tier 4", `unexpected score_band: ${scoreBand}`);

const html = renderToStaticMarkup(
  React.createElement(EvaluationDashboard, {
    result: EVALUATION_FIXTURE,
    sermonTitle: EVALUATION_FIXTURE.meta.sermon_title,
  }),
);

assert(html.includes("Boasting That Sounds Like Defeat"), "missing sermon title");
assert(html.includes("Where It's Strong"), "missing whats_working section");
assert(html.includes("Where You Can Grow"), "missing priorities section");
assert(html.includes("Methodology"), "missing methodology section");
assert(
  !html.includes("Heat Map · Emotional Beats"),
  "heat map section should be hidden when audio unavailable",
);

console.log("PASS stub smoke test");
console.log(`  EVALUATION_USE_STUB=${process.env.EVALUATION_USE_STUB ?? "(unset)"}`);
console.log(`  prompt_version=${EVALUATION_FIXTURE_PROMPT_VERSION}`);
console.log(`  score_band=${scoreBand}`);
console.log(`  rendered_bytes=${html.length}`);
