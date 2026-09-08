import { serifFont, uiFont } from "@/components/evaluation/shared";
import type { MovementReportSnapshot } from "@/lib/movement/types";
import { themeDisplayName } from "@/lib/movement/themes";

function CountArrow({
  baselineHits,
  baselineEligible,
  comparisonHits,
  comparisonEligible,
}: {
  baselineHits: number;
  baselineEligible: number;
  comparisonHits: number;
  comparisonEligible: number;
}) {
  return (
    <span style={{ ...serifFont, color: "var(--sc-ink)" }}>
      {baselineHits} of {baselineEligible}
      <span style={{ color: "var(--sc-ink-soft)" }}> → </span>
      {comparisonHits} of {comparisonEligible}
    </span>
  );
}

export function MovementReportView({
  snapshot,
}: {
  snapshot: MovementReportSnapshot;
}) {
  return (
    <article
      className="mx-auto max-w-[680px] border px-8 py-12 md:px-[60px] md:py-14"
      style={{
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
        boxShadow: "var(--sc-shadow)",
      }}
    >
      <p
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        Movement report · {themeDisplayName(snapshot.themeId)}
      </p>
      <h1
        className="mb-3 text-[32px] font-normal leading-tight tracking-tight md:text-[36px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Did it move?
      </h1>
      <p
        className="mb-10 max-w-[52ch] text-[15px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {snapshot.sampleFace}
      </p>

      <section className="mb-12">
        <h2
          className="mb-4 text-[13px] font-semibold uppercase tracking-[0.1em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Verdict
        </h2>
        <ul className="m-0 list-none space-y-3 p-0">
          {snapshot.disciplines.map((row) => (
            <li
              key={row.measureId}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-3"
              style={{ borderColor: "var(--sc-rule)" }}
            >
              <span
                className="text-[17px]"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {row.label}
              </span>
              <span className="flex flex-wrap items-baseline gap-3 text-[15px]">
                <CountArrow
                  baselineHits={row.baseline.hits}
                  baselineEligible={row.baseline.eligible}
                  comparisonHits={row.comparison.hits}
                  comparisonEligible={row.comparison.eligible}
                />
                <strong
                  className="text-[13px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...uiFont, color: "var(--sc-accent)" }}
                >
                  {row.verdict}
                </strong>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {snapshot.movedDetails.length > 0 ? (
        <section className="mb-12">
          <h2
            className="mb-6 text-[22px] font-normal"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            What moved
          </h2>
          {snapshot.movedDetails.map((row) => (
            <div key={row.measureId} className="mb-10 last:mb-0">
              <h3
                className="mb-2 text-[18px]"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {row.label}
              </h3>
              <p className="mb-4 text-[15px]" style={{ ...serifFont }}>
                <CountArrow
                  baselineHits={row.baseline.hits}
                  baselineEligible={row.baseline.eligible}
                  comparisonHits={row.comparison.hits}
                  comparisonEligible={row.comparison.eligible}
                />
              </p>
              {row.was ? (
                <div className="mb-4">
                  <p
                    className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...uiFont, color: "var(--sc-accent)" }}
                  >
                    Was
                  </p>
                  <blockquote
                    className="m-0 border-l-2 pl-3.5 text-[16px] leading-snug"
                    style={{
                      ...serifFont,
                      borderColor: "var(--sc-rule)",
                      color: "var(--sc-ink)",
                    }}
                  >
                    “{row.was.quote}”
                  </blockquote>
                  <p
                    className="mt-1.5 text-[13px]"
                    style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
                  >
                    {row.was.sermonTitle}
                  </p>
                </div>
              ) : null}
              {row.now ? (
                <div className="mb-4">
                  <p
                    className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ ...uiFont, color: "var(--sc-accent)" }}
                  >
                    Now
                  </p>
                  <blockquote
                    className="m-0 border-l-2 pl-3.5 text-[16px] leading-snug"
                    style={{
                      ...serifFont,
                      borderColor: "var(--sc-rule)",
                      color: "var(--sc-ink)",
                    }}
                  >
                    “{row.now.quote}”
                  </blockquote>
                  <p
                    className="mt-1.5 text-[13px]"
                    style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
                  >
                    {row.now.sermonTitle}
                  </p>
                </div>
              ) : null}
              <p
                className="max-w-[56ch] text-[15px] leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
              >
                {row.paragraph}
              </p>
            </div>
          ))}
        </section>
      ) : (
        <section className="mb-12">
          <p
            className="max-w-[56ch] text-[16px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            None of the three disciplines moved. That is the answer, and the
            report does not soften it.
          </p>
        </section>
      )}

      {snapshot.heldDetails.length > 0 ? (
        <section className="mb-12">
          <h2
            className="mb-6 text-[22px] font-normal"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            What held
          </h2>
          {snapshot.heldDetails.map((row) => (
            <div key={row.measureId} className="mb-8 last:mb-0">
              <h3
                className="mb-2 text-[18px]"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {row.label}
              </h3>
              <p className="mb-3 text-[15px]" style={{ ...serifFont }}>
                <CountArrow
                  baselineHits={row.baseline.hits}
                  baselineEligible={row.baseline.eligible}
                  comparisonHits={row.comparison.hits}
                  comparisonEligible={row.comparison.eligible}
                />
              </p>
              <p
                className="mb-3 max-w-[56ch] text-[15px] leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
              >
                {row.paragraph}
              </p>
              <p
                className="max-w-[56ch] text-[15px] leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {row.tryNext}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      {snapshot.slippedDetails.length > 0 ? (
        <section className="mb-12">
          <h2
            className="mb-6 text-[22px] font-normal"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            What slipped
          </h2>
          {snapshot.slippedDetails.map((row) => (
            <div key={row.measureId} className="mb-8 last:mb-0">
              <h3
                className="mb-2 text-[18px]"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {row.label}
              </h3>
              <p className="mb-3 text-[15px]" style={{ ...serifFont }}>
                <CountArrow
                  baselineHits={row.baseline.hits}
                  baselineEligible={row.baseline.eligible}
                  comparisonHits={row.comparison.hits}
                  comparisonEligible={row.comparison.eligible}
                />
              </p>
              <p
                className="max-w-[56ch] text-[15px] leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
              >
                {row.paragraph}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      {snapshot.unworked.length > 0 ? (
        <section className="mb-12">
          <h2
            className="mb-4 text-[22px] font-normal"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            What you did not work on
          </h2>
          <p
            className="mb-4 max-w-[56ch] text-[14.5px] leading-relaxed"
            style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
          >
            Reported briefly. Not credited as success.
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {snapshot.unworked.map((row) => (
              <li key={row.measureId} className="text-[15px]">
                <span style={{ ...serifFont, color: "var(--sc-ink)" }}>
                  {row.label}
                </span>
                <span style={{ ...serifFont, color: "var(--sc-ink-soft)" }}>
                  {" "}
                  ·{" "}
                </span>
                <CountArrow
                  baselineHits={row.baseline.hits}
                  baselineEligible={row.baseline.eligible}
                  comparisonHits={row.comparison.hits}
                  comparisonEligible={row.comparison.eligible}
                />
                <span
                  className="ml-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
                  style={{ ...uiFont, color: "var(--sc-accent)" }}
                >
                  {row.verdict}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-10">
        <h2
          className="mb-3 text-[22px] font-normal"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          What comes next
        </h2>
        <p
          className="max-w-[56ch] text-[15px] leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          {snapshot.offerSameTheme
            ? "One or none of the three moved. The offer is another six months on the same theme, not a new subject. That choice is yours."
            : "Two or three disciplines moved. This theme can close, and the next diagnostic can follow."}
        </p>
      </section>

      <section
        className="mb-8 border-t pt-6"
        style={{ borderColor: "var(--sc-rule)" }}
      >
        <p
          className="max-w-[56ch] text-[14.5px] leading-relaxed"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          {snapshot.standingBlock}
        </p>
      </section>

      <p
        className="max-w-[56ch] text-[13px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        {snapshot.methodNote}
      </p>
    </article>
  );
}
