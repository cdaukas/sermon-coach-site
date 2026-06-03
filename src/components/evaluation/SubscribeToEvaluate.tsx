import Link from "next/link";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type SubscribeToEvaluateProps = {
  className?: string;
};

export function SubscribeToEvaluate({ className = "" }: SubscribeToEvaluateProps) {
  return (
    <div
      className={`rounded border px-5 py-5 ${className}`.trim()}
      style={{
        background: "var(--sc-accent-pale)",
        borderColor: "var(--sc-rule)",
      }}
    >
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
        manuscript evaluation.
      </p>
      <Link
        href="/pricing.html"
        className="mt-4 inline-block rounded px-5 py-2.5 text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
        style={{
          ...uiFont,
          background: "var(--sc-ink)",
          color: "#faf8f3",
        }}
      >
        View pricing
      </Link>
    </div>
  );
}
