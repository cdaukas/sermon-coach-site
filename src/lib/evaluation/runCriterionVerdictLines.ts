import Anthropic from "@anthropic-ai/sdk";
import {
  buildEvalCostLogPayload,
  logEvalCost,
  sumEvalUsage,
  usageFromResponse,
  type EvalUsageTotals,
} from "./eval-cost";
import {
  clearCriterionVerdictLines,
  mergeCriterionVerdictLines,
  type EvaluationResultStrict,
} from "./schema";
import {
  buildVerdictLineQualityRetryNote,
  buildVerdictLineSystemPrompt,
  buildVerdictLineUserMessage,
  VERDICT_LINE_MAX_WORDS,
  VERDICT_LINE_MODEL,
  type VerdictLineCriterionInput,
} from "./verdict-line-prompt";
import {
  collectVerdictLineQualityIssues,
  enforceVerdictLineWordCap,
  hasOverlongVerdictLine,
  submitCriterionVerdictLinesTool,
  validateAndMapVerdictLines,
  validateAndMapVerdictLinesPartial,
  type VerdictLineQualityIssue,
} from "./verdict-line-schema";

export type RunCriterionVerdictLinesSuccess = {
  result: EvaluationResultStrict;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export class CriterionVerdictLinesError extends Error {
  constructor(
    message: string,
    readonly code: "config" | "api" | "schema" | "tool",
  ) {
    super(message);
    this.name = "CriterionVerdictLinesError";
  }
}

export type CreateVerdictLineMessage = (
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
) => Promise<Anthropic.Messages.Message>;

export type RunCriterionVerdictLinesOptions = {
  createMessage?: CreateVerdictLineMessage;
  model?: string;
};

function flattenCriteria(
  result: EvaluationResultStrict,
): VerdictLineCriterionInput[] {
  const out: VerdictLineCriterionInput[] = [];
  for (const category of result.categories) {
    for (const c of category.criteria) {
      out.push({
        id: c.id,
        name: c.name,
        score: c.score,
        narrative: c.narrative,
        anchored_quote: c.anchored_quote ?? null,
      });
    }
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

function scoresByIdFromCriteria(
  criteria: VerdictLineCriterionInput[],
): Map<number, number> {
  return new Map(criteria.map((c) => [c.id, c.score]));
}

function extractToolInput(
  content: Anthropic.Messages.ContentBlock[],
): unknown {
  const block = content.find(
    (item) =>
      item.type === "tool_use" &&
      item.name === submitCriterionVerdictLinesTool.name,
  );

  if (!block || block.type !== "tool_use") {
    throw new CriterionVerdictLinesError(
      "Model did not return submit_criterion_verdict_lines tool output.",
      "tool",
    );
  }

  return block.input;
}

async function callHaiku(
  model: string,
  criteria: VerdictLineCriterionInput[],
  createMessage: CreateVerdictLineMessage,
  retryNote?: string,
): Promise<{ model: string; usage: EvalUsageTotals; toolInput: unknown }> {
  let response: Anthropic.Messages.Message;

  const userContent = retryNote
    ? `${buildVerdictLineUserMessage(criteria)}\n\n${retryNote}`
    : buildVerdictLineUserMessage(criteria);

  try {
    response = await createMessage({
      model,
      max_tokens: 2_000,
      system: buildVerdictLineSystemPrompt(),
      tools: [submitCriterionVerdictLinesTool],
      tool_choice: {
        type: "tool",
        name: submitCriterionVerdictLinesTool.name,
      },
      messages: [{ role: "user", content: userContent }],
    });
  } catch {
    throw new CriterionVerdictLinesError(
      "The verdict-line service is temporarily unavailable.",
      "api",
    );
  }

  return {
    model: response.model,
    usage: usageFromResponse(response.usage),
    toolInput: extractToolInput(response.content),
  };
}

function logQualityIssues(
  label: string,
  issues: VerdictLineQualityIssue[],
): void {
  for (const issue of issues) {
    const preview =
      issue.line.length > 100
        ? `${issue.line.slice(0, 97)}...`
        : issue.line;
    console.warn(
      `[verdict-lines] ${label}: criterion ${issue.id} (score ${issue.score}) — ${issue.reason}: ${issue.detail}. Preview: ${preview}`,
    );
  }
}

/**
 * Merge retry lines for requested ids that no longer have quality issues.
 * Leaves other ids unchanged. If the model returned all eleven, only
 * requested ids are considered.
 */
function mergeQualityRetryFixes(
  linesById: Map<number, string>,
  retryLines: Map<number, string>,
  requestedIds: ReadonlySet<number>,
  scoresById: ReadonlyMap<number, number>,
): { merged: Map<number, string>; fixedIds: number[]; stillBadIds: number[] } {
  const merged = new Map(linesById);
  const fixedIds: number[] = [];
  const stillBadIds: number[] = [];

  for (const id of requestedIds) {
    const candidate = retryLines.get(id);
    if (!candidate) {
      stillBadIds.push(id);
      continue;
    }

    const issues = collectVerdictLineQualityIssues(
      new Map([[id, candidate]]),
      scoresById,
    );
    if (issues.length === 0) {
      merged.set(id, candidate);
      fixedIds.push(id);
    } else {
      stillBadIds.push(id);
    }
  }

  return { merged, fixedIds, stillBadIds };
}

/**
 * Batched Haiku pass: eleven lines from finished criterion narratives.
 * Call after runEvaluation; merge into result before the single complete write.
 *
 * Length: 12–18 words is advised in the prompt. Overlong batch → one full
 * retry with a hard-cap reminder. Then sentence-parse checks (incomplete
 * grammatical tail + subject-verb agreement) with one targeted retry for
 * failing ids. Hinge is never required for acceptance. Then clause-boundary
 * cap before merge. Incomplete truncates (dangling "than"/"but"/prepositions)
 * are rejected: keep the uncapped attempt and log the overshoot.
 *
 * Path (always):
 *   tool → validateAndMap → [optional retry if hasOverlong] →
 *   quality (sentence parse) → [optional targeted retry] →
 *   enforceVerdictLineWordCap → mergeCriterionVerdictLines
 * Job path and backfill both call this function; there is no bypass merge.
 */
export async function runCriterionVerdictLines(
  result: EvaluationResultStrict,
  options?: RunCriterionVerdictLinesOptions,
): Promise<RunCriterionVerdictLinesSuccess> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new CriterionVerdictLinesError(
      "ANTHROPIC_API_KEY is not configured.",
      "config",
    );
  }

  const model = options?.model ?? VERDICT_LINE_MODEL;
  const client = new Anthropic({ apiKey });
  const createMessage =
    options?.createMessage ??
    ((params) => client.messages.create(params));

  const criteria = flattenCriteria(result);
  if (criteria.length !== 11) {
    throw new CriterionVerdictLinesError(
      `Expected 11 criteria, got ${criteria.length}.`,
      "schema",
    );
  }

  const scoresById = scoresByIdFromCriteria(criteria);
  const attemptUsages: EvalUsageTotals[] = [];
  let responseModel = model;
  let linesById: Map<number, string>;

  const first = await callHaiku(model, criteria, createMessage);
  attemptUsages.push(first.usage);
  responseModel = first.model;

  try {
    linesById = validateAndMapVerdictLines(first.toolInput);
  } catch (error) {
    console.error("[verdict-lines] Schema validation failed.", error);
    throw new CriterionVerdictLinesError(
      "Verdict-line response failed validation.",
      "schema",
    );
  }

  if (hasOverlongVerdictLine(linesById, VERDICT_LINE_MAX_WORDS)) {
    console.warn(
      `[verdict-lines] One or more lines exceeded ${VERDICT_LINE_MAX_WORDS} words; retrying once.`,
    );
    const retry = await callHaiku(
      model,
      criteria,
      createMessage,
      `RETRY: Every verdict_line must be at most ${VERDICT_LINE_MAX_WORDS} words. Shorter is better. Count words before submit.`,
    );
    attemptUsages.push(retry.usage);
    responseModel = retry.model;

    try {
      linesById = validateAndMapVerdictLines(retry.toolInput);
    } catch (error) {
      console.error("[verdict-lines] Schema validation failed on retry.", error);
      throw new CriterionVerdictLinesError(
        "Verdict-line response failed validation.",
        "schema",
      );
    }
  }

  // Sentence parse (incomplete tail + SV agreement) — hard validation with
  // one targeted retry. Single-clause lines are valid (no hinge required).
  let qualityIssues = collectVerdictLineQualityIssues(linesById, scoresById);
  if (qualityIssues.length > 0) {
    logQualityIssues("Quality invalid on first pass", qualityIssues);
    const badIds = [...new Set(qualityIssues.map((i) => i.id))].sort(
      (a, b) => a - b,
    );
    const repairCriteria = criteria.filter((c) => badIds.includes(c.id));
    console.warn(
      `[verdict-lines] Retrying ${badIds.length} criteria for quality: [${badIds.join(", ")}]`,
    );

    const qualityRetry = await callHaiku(
      model,
      repairCriteria,
      createMessage,
      buildVerdictLineQualityRetryNote(qualityIssues),
    );
    attemptUsages.push(qualityRetry.usage);
    responseModel = qualityRetry.model;

    try {
      const retryLines = validateAndMapVerdictLinesPartial(
        qualityRetry.toolInput,
      );
      const { merged, fixedIds, stillBadIds } = mergeQualityRetryFixes(
        linesById,
        retryLines,
        new Set(badIds),
        scoresById,
      );
      linesById = merged;
      console.warn(
        `[verdict-lines] Quality retry: fixed [${fixedIds.join(", ") || "none"}]; still invalid [${stillBadIds.join(", ") || "none"}]`,
      );
    } catch (error) {
      console.error(
        "[verdict-lines] Quality retry parse failed; keeping first-pass lines.",
        error,
      );
    }

    qualityIssues = collectVerdictLineQualityIssues(linesById, scoresById);
    if (qualityIssues.length > 0) {
      logQualityIssues("Quality still invalid after retry (shipping)", qualityIssues);
    }
  }

  // Prefer clause-boundary cap before merge. Truncate is a no-op under the
  // ceiling. If every candidate ends incomplete (dangling comparative /
  // conjunction / preposition), keep the uncapped attempt rather than ship
  // a sentence that does not parse.
  if (hasOverlongVerdictLine(linesById, VERDICT_LINE_MAX_WORDS)) {
    console.warn(
      `[verdict-lines] Cap still exceeded; truncating to clause boundary at ${VERDICT_LINE_MAX_WORDS} words.`,
    );
  }
  const capped = enforceVerdictLineWordCap(linesById, VERDICT_LINE_MAX_WORDS);
  linesById = capped.lines;
  for (const rejected of capped.rejectedBrokenTruncate) {
    console.warn(
      `[verdict-lines] Cap exceeded (reject-broken-truncate): criterion ${rejected.id} kept at ${rejected.wordCount} words (last word "${rejected.lastWord}") rather than shipping an incomplete sentence. Preview: ${rejected.attemptPreview}`,
    );
  }

  const merged = mergeCriterionVerdictLines(result, linesById);
  const billedUsage = sumEvalUsage(attemptUsages);

  logEvalCost(
    buildEvalCostLogPayload({
      model: responseModel,
      usage: billedUsage,
      apiAttempts: attemptUsages.length,
    }),
  );

  return {
    result: merged,
    model: responseModel,
    inputTokens: billedUsage.input_tokens,
    outputTokens: billedUsage.output_tokens,
  };
}

export type CriterionVerdictLinesLogContext = {
  evaluationId: string;
  userId: string;
};

export type RunCriterionVerdictLinesBestEffortResult = {
  result: EvaluationResultStrict;
  inputTokens: number;
  outputTokens: number;
};

/**
 * Never fails the evaluation. On any error, write null verdict_lines and continue.
 */
export async function runCriterionVerdictLinesBestEffort(
  result: EvaluationResultStrict,
  logContext: CriterionVerdictLinesLogContext,
  options?: RunCriterionVerdictLinesOptions,
): Promise<RunCriterionVerdictLinesBestEffortResult> {
  try {
    const pass = await runCriterionVerdictLines(result, options);
    return {
      result: pass.result,
      inputTokens: pass.inputTokens,
      outputTokens: pass.outputTokens,
    };
  } catch (error) {
    console.error("[verdict-lines] Non-fatal generation failed.", {
      evaluationId: logContext.evaluationId,
      userId: logContext.userId,
      error,
    });
    return {
      result: clearCriterionVerdictLines(result),
      inputTokens: 0,
      outputTokens: 0,
    };
  }
}
