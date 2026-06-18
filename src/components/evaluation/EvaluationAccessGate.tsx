import Link from "next/link";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationAccessGateProps = {
  entitlement: EvaluationEntitlement | null;
  className?: string;
};

function CapacityAlert({
  className,
  message,
}: {
  className: string;
  message: string;
}) {
  return (
    <p
      className={`text-[13px] leading-relaxed ${className}`.trim()}
      style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
    >
      {message}{" "}
      <Link
        href="/dashboard/buy"
        className="font-medium no-underline hover:underline"
        style={{ color: "var(--sc-accent)" }}
      >
        Visit Buy
      </Link>{" "}
      to add capacity.
    </p>
  );
}

export function EvaluationCreditNotice({
  entitlement,
  className = "",
}: EvaluationAccessGateProps) {
  if (!entitlement?.canEvaluate) {
    return null;
  }

  const notices: string[] = [];

  if (entitlement.creditSource === "free" && entitlement.freeRemaining > 0) {
    notices.push(
      `${entitlement.freeRemaining} free evaluation${entitlement.freeRemaining === 1 ? "" : "s"} remaining`,
    );
  }

  if (entitlement.packRemaining > 0) {
    notices.push(
      `${entitlement.packRemaining} pack evaluation${entitlement.packRemaining === 1 ? "" : "s"} remaining`,
    );
  }

  if (notices.length === 0) {
    return null;
  }

  return (
    <p
      className={`text-[13px] leading-relaxed ${className}`.trim()}
      style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
    >
      {notices.join(" · ")}
      {entitlement.creditSource === "free" ? " — save a sermon, then run your evaluation." : null}
    </p>
  );
}

export function EvaluationAccessGate({
  entitlement,
  className = "",
}: EvaluationAccessGateProps) {
  if (!entitlement || entitlement.canEvaluate) {
    return null;
  }

  if (entitlement.blockedReason === "monthly_limit") {
    return (
      <CapacityAlert
        className={className}
        message="You've used all your evaluations this month."
      />
    );
  }

  if (entitlement.blockedReason === "no_credits") {
    return (
      <CapacityAlert
        className={className}
        message="No evaluation credits remaining."
      />
    );
  }

  return null;
}
