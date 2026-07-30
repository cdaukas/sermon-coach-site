export const ACTIVE_EVAL_IN_PROGRESS_ERROR =
  "You already have an evaluation in progress. Wait for it to finish before starting another.";

export const MENTORED_ALLOTMENT_EXHAUSTED_ERROR =
  "You've used this month's submissions. Your next one opens on the first.";

export const MENTORED_ALREADY_IN_FLIGHT_ERROR =
  "That sermon is already being read. Give it a minute.";

export const EVAL_START_FAILED_BANNER =
  "Your sermon was saved, but the evaluation could not start. You can run it from this page.";

export const EVAL_POLL_FAILED_BANNER =
  "Your sermon was saved and the evaluation is running. We lost track of its progress. Refresh this page in a minute or two.";

/** Query param values for /dashboard/sermons/{id}?evalError=… */
export type EvalErrorParam =
  | "start"
  | "active"
  | "poll"
  | "1"
  | "allotment"
  | "in_flight";

export function evalErrorParamForStartFailure(error: string): EvalErrorParam {
  if (error === ACTIVE_EVAL_IN_PROGRESS_ERROR) {
    return "active";
  }
  if (error === MENTORED_ALLOTMENT_EXHAUSTED_ERROR) {
    return "allotment";
  }
  if (error === MENTORED_ALREADY_IN_FLIGHT_ERROR) {
    return "in_flight";
  }
  return "start";
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

  if (param === "allotment") {
    return MENTORED_ALLOTMENT_EXHAUSTED_ERROR;
  }

  if (param === "in_flight") {
    return MENTORED_ALREADY_IN_FLIGHT_ERROR;
  }

  if (param === "poll") {
    return EVAL_POLL_FAILED_BANNER;
  }

  if (param === "start" || param === "1") {
    return EVAL_START_FAILED_BANNER;
  }

  return EVAL_START_FAILED_BANNER;
}
