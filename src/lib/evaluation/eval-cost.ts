import type Anthropic from "@anthropic-ai/sdk";

/** Per-million-token USD rates. VERIFY against https://www.anthropic.com/pricing — not auto-synced. */
export type ModelRatesUsdPerMtok = {
  input: number;
  output: number;
  cache_write?: number;
  cache_read?: number;
};

export const MODEL_RATES_USD_PER_MTOK: Record<string, ModelRatesUsdPerMtok> = {
  // Default product model (prompt.ts getEvaluationModel fallback).
  "claude-opus-4-8": {
    input: 5,
    output: 25,
    cache_write: 6.25,
    cache_read: 0.5,
  },
  // Common env override documented in STEP_6_PLAN / SESSION_HANDOFF.
  "claude-sonnet-4-6": {
    input: 3,
    output: 15,
    cache_write: 3.75,
    cache_read: 0.3,
  },
};

export type EvalUsageTotals = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
};

export function usageFromResponse(usage: Anthropic.Messages.Usage): EvalUsageTotals {
  return {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
  };
}

export function sumEvalUsage(totals: EvalUsageTotals[]): EvalUsageTotals {
  return totals.reduce(
    (acc, row) => ({
      input_tokens: acc.input_tokens + row.input_tokens,
      output_tokens: acc.output_tokens + row.output_tokens,
      cache_creation_input_tokens:
        acc.cache_creation_input_tokens + row.cache_creation_input_tokens,
      cache_read_input_tokens:
        acc.cache_read_input_tokens + row.cache_read_input_tokens,
    }),
    {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  );
}

export function computeEvalCostUsd(
  model: string,
  usage: EvalUsageTotals,
): number | null {
  const rates = MODEL_RATES_USD_PER_MTOK[model];
  if (!rates) {
    return null;
  }

  const inputCost = (usage.input_tokens / 1_000_000) * rates.input;
  const outputCost = (usage.output_tokens / 1_000_000) * rates.output;
  const cacheWriteCost =
    usage.cache_creation_input_tokens > 0 && rates.cache_write != null
      ? (usage.cache_creation_input_tokens / 1_000_000) * rates.cache_write
      : 0;
  const cacheReadCost =
    usage.cache_read_input_tokens > 0 && rates.cache_read != null
      ? (usage.cache_read_input_tokens / 1_000_000) * rates.cache_read
      : 0;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

export type EvalCostLogPayload = {
  tag: "eval_cost";
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  api_attempts: number;
  cost_usd: number | null;
  ts: string;
};

export function buildEvalCostLogPayload(params: {
  model: string;
  usage: EvalUsageTotals;
  apiAttempts: number;
  ts?: string;
}): EvalCostLogPayload {
  const { model, usage, apiAttempts, ts = new Date().toISOString() } = params;
  const payload: EvalCostLogPayload = {
    tag: "eval_cost",
    model,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    api_attempts: apiAttempts,
    cost_usd: computeEvalCostUsd(model, usage),
    ts,
  };

  if (usage.cache_creation_input_tokens > 0) {
    payload.cache_creation_input_tokens = usage.cache_creation_input_tokens;
  }
  if (usage.cache_read_input_tokens > 0) {
    payload.cache_read_input_tokens = usage.cache_read_input_tokens;
  }

  return payload;
}

export function logEvalCost(payload: EvalCostLogPayload): void {
  console.log(JSON.stringify(payload));
}
