import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEvalCostLogPayload,
  computeEvalCostUsd,
  sumEvalUsage,
  usageFromResponse,
} from "./eval-cost";

describe("eval cost logging", () => {
  it("computes opus 4.8 cost from standard token usage", () => {
    const cost = computeEvalCostUsd("claude-opus-4-8", {
      input_tokens: 10_000,
      output_tokens: 2_000,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    });

    assert.equal(cost, 0.1);
  });

  it("returns null cost when model is absent from the rate table", () => {
    const cost = computeEvalCostUsd("claude-test-model", {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    });

    assert.equal(cost, null);
  });

  it("sums usage across retry attempts", () => {
    const summed = sumEvalUsage([
      {
        input_tokens: 10,
        output_tokens: 20,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
      {
        input_tokens: 15,
        output_tokens: 25,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    ]);

    assert.deepEqual(summed, {
      input_tokens: 25,
      output_tokens: 45,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    });
  });

  it("builds a metadata-only eval_cost payload", () => {
    const payload = buildEvalCostLogPayload({
      model: "claude-opus-4-8",
      usage: usageFromResponse({
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_input_tokens: null,
        cache_read_input_tokens: null,
        cache_creation: null,
        inference_geo: null,
        server_tool_use: null,
        service_tier: "standard",
      }),
      apiAttempts: 2,
      ts: "2026-06-09T12:00:00.000Z",
    });

    assert.equal(payload.tag, "eval_cost");
    assert.equal(payload.input_tokens, 1000);
    assert.equal(payload.output_tokens, 500);
    assert.equal(payload.api_attempts, 2);
    assert.equal(payload.cost_usd, 0.0175);
    assert.equal(payload.ts, "2026-06-09T12:00:00.000Z");
    assert.equal("cache_creation_input_tokens" in payload, false);
  });
});
