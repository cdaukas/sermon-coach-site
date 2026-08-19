import Link from "next/link";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";
import {
  evaluationReportCopy,
  type OutputLanguage,
} from "@/lib/evaluation/output-language";

const uiFont = { fontFamily: "var(--font-ui)" };

type EvaluationAccessGateProps = {
  entitlement: EvaluationEntitlement | null;
  className?: string;
  outputLanguage?: OutputLanguage;
};

function CapacityAlert({
  className,
  message,
  visitBuy,
  toAddCapacity,
}: {
  className: string;
  message: string;
  visitBuy: string;
  toAddCapacity: string;
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
        {visitBuy}
      </Link>{" "}
      {toAddCapacity}
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
      `${entitlement.freeRemaining} free credit${entitlement.freeRemaining === 1 ? "" : "s"} remaining`,
    );
  }

  if (entitlement.packRemaining > 0) {
    notices.push(
      `${entitlement.packRemaining} pack credit${entitlement.packRemaining === 1 ? "" : "s"} remaining`,
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
      {entitlement.creditSource === "free" ? ", then save a sermon and run your evaluation." : null}
    </p>
  );
}

export function EvaluationAccessGate({
  entitlement,
  className = "",
  outputLanguage = "en",
}: EvaluationAccessGateProps) {
  const copy = evaluationReportCopy(outputLanguage);

  if (!entitlement || entitlement.canEvaluate) {
    return null;
  }

  if (entitlement.blockedReason === "monthly_limit") {
    return (
      <CapacityAlert
        className={className}
        message={copy.creditsUsedThisMonth}
        visitBuy={copy.visitBuy}
        toAddCapacity={copy.toAddCapacity}
      />
    );
  }

  if (entitlement.blockedReason === "no_credits") {
    return (
      <CapacityAlert
        className={className}
        message={copy.noCreditsRemaining}
        visitBuy={copy.visitBuy}
        toAddCapacity={copy.toAddCapacity}
      />
    );
  }

  return null;
}
