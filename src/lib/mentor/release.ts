export type ReleaseMentoredEvaluationErrorCode =
  | "not_releasable"
  | "not_your_mentee"
  | "seat_holds_nothing"
  | "already_released_or_incomplete";

export type ReleaseMentoredEvaluationResult =
  | {
      ok: true;
      error_code: null;
      evaluation_id: string;
      released_to_mentee_at: string;
    }
  | {
      ok: false;
      error_code: ReleaseMentoredEvaluationErrorCode | string;
    };

const ERROR_MESSAGES: Record<ReleaseMentoredEvaluationErrorCode, string> = {
  already_released_or_incomplete:
    "That evaluation has already been released.",
  not_your_mentee: "You are not the mentor on that relationship.",
  seat_holds_nothing: "Nothing is being held on that seat.",
  not_releasable: "That evaluation cannot be released.",
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

export function releaseMentoredEvaluationErrorMessage(
  errorCode: string | null | undefined,
): string {
  if (
    errorCode === "already_released_or_incomplete" ||
    errorCode === "not_your_mentee" ||
    errorCode === "seat_holds_nothing" ||
    errorCode === "not_releasable"
  ) {
    return ERROR_MESSAGES[errorCode];
  }
  return GENERIC_ERROR;
}
