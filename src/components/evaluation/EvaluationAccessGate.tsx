import Link from "next/link";
import type { EvaluationEntitlement } from "@/lib/evaluation/entitlement-types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

const panelClassName = "rounded border px-5 py-5";
const panelStyle = {
  background: "var(--sc-accent-pale)",
  borderColor: "var(--sc-rule)",
} as const;

const primaryButtonClassName =
  "inline-block rounded px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90";
const primaryButtonStyle = {
  ...uiFont,
  background: "var(--sc-ink)",
  color: "#faf8f3",
} as const;

type EvaluationAccessGateProps = {
  entitlement: EvaluationEntitlement | null;
  className?: string;
};

function NoCreditsGatePanel({ className }: { className: string }) {
  return (
    <div className={`${panelClassName} ${className}`.trim()} style={panelStyle}>
      <p
        className="text-[15px] font-semibold leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Subscribe to start evaluating
      </p>
      <p
        className="mt-2 text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        An active subscription is required before The Sermon Coach can run a
        manuscript evaluation. Or buy a pack if you only preach occasionally.
      </p>
      <Link href="/pricing.html" className={`mt-4 ${primaryButtonClassName}`} style={primaryButtonStyle}>
        View pricing
      </Link>
    </div>
  );
}

function MonthlyLimitGatePanel({
  className,
  monthlyLimit,
}: {
  className: string;
  monthlyLimit: number;
}) {
  return (
    <div className={`${panelClassName} ${className}`.trim()} style={panelStyle}>
      <p
        className="text-[15px] font-semibold leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        You&apos;ve used all {monthlyLimit} evaluations this month.
      </p>
      <p
        className="mt-2 text-[13px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Your monthly evaluations reset at the start of your next billing cycle. If
        you need to evaluate a sermon before then, a pack adds evaluations to your
        account right away, with no change to your subscription.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link
          href="/pricing.html#packs"
          className={primaryButtonClassName}
          style={primaryButtonStyle}
        >
          Buy a pack
        </Link>
        <Link
          href="/pricing.html"
          className="text-[13px] font-medium no-underline hover:underline"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          See plans
        </Link>
      </div>
    </div>
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

  if (entitlement.blockedReason === "monthly_limit" && entitlement.usage) {
    return (
      <MonthlyLimitGatePanel
        className={className}
        monthlyLimit={entitlement.usage.limit}
      />
    );
  }

  if (entitlement.blockedReason === "no_credits") {
    return <NoCreditsGatePanel className={className} />;
  }

  return null;
}
