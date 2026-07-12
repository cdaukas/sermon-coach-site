export const ACTIVE_EVAL_IN_PROGRESS_ERROR =
  "You already have an evaluation in progress. Wait for it to finish before starting another.";

export const EVAL_START_FAILED_BANNER =
  "Your sermon was saved, but the evaluation could not start. You can run it from this page.";

export const EVAL_POLL_FAILED_BANNER =
  "Your sermon was saved and the evaluation is running. We lost track of its progress. Refresh this page in a minute or two.";

/** Query param values for /dashboard/sermons/{id}?evalError=… */
export type EvalErrorParam = "start" | "active" | "poll" | "1";

export function evalErrorParamForStartFailure(error: string): EvalErrorParam {
  return error === ACTIVE_EVAL_IN_PROGRESS_ERROR ? "active" : "start";
}

export function messageForEvalErrorParam(
  param: string | null | undefined,
): string | null {
  if (!param) {
    return null;
  }

  if (param === "active") {
    return ACTIVE_EVAL_IN_PROGRESS_ERROR;
  }

  if (param === "poll") {
    return EVAL_POLL_FAILED_BANNER;
  }

  if (param === "start" || param === "1") {
    return EVAL_START_FAILED_BANNER;
  }

  return EVAL_START_FAILED_BANNER;
}
