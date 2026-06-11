type Props = {
  totalRemaining: number;
  soonestExpiry: string | null;
};

const uiFont = { fontFamily: "var(--font-ui)" };

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PackCreditsCard({ totalRemaining, soonestExpiry }: Props) {
  const expiryLabel = formatExpiry(soonestExpiry);
  const creditWord = totalRemaining === 1 ? "credit" : "credits";

  return (
    <div
      className="mb-8 rounded px-6 py-5"
      style={{
        background: "var(--sc-accent-pale)",
        border: "1px solid var(--sc-rule)",
        borderLeft: "3px solid var(--sc-accent)",
      }}
    >
      <p
        className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Pack credits
      </p>
      <p
        className="text-[18px] font-semibold"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        {totalRemaining} {creditWord} remaining
      </p>
      {expiryLabel ? (
        <p
          className="mt-1 text-[13px]"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Soonest to expire: {expiryLabel}
        </p>
      ) : null}
    </div>
  );
}
