import { serifFont, uiFont } from "./fonts";

const BAR_HEIGHTS = [38, 44, 50, 57, 63, 68, 73, 79, 84, 90] as const;

const METRICS = [
  { label: "Biblical Faithfulness", score: "9.2", width: 92 },
  { label: "Gospel Clarity", score: "9.0", width: 90 },
  { label: "Expository Structure", score: "8.7", width: 87 },
  { label: "Application", score: "7.5", width: 75 },
] as const;

export function HomeV2GrowthProfile() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 pb-20 pt-5 max-[720px]:px-5 max-[720px]:pb-14">
      <div className="text-center">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Your preaching growth profile
        </p>
        <h2
          className="mx-auto mb-[18px] max-w-[760px] text-[36px] font-semibold leading-[1.2] tracking-[-0.01em] max-[720px]:text-[28px]"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Don&apos;t just know how your sermon did. Know how you&apos;re
          developing.
        </h2>
        <p
          className="mx-auto max-w-[720px] text-[17px] leading-[1.7]"
          style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
        >
          Every sermon becomes part of a long-term picture of your strengths,
          blind spots, and next areas for growth.
        </p>
      </div>

      <div
        className="mt-[45px] overflow-hidden rounded"
        style={{
          background: "var(--sc-panel)",
          boxShadow: "var(--sc-shadow-lift)",
        }}
      >
        <div
          className="flex items-start justify-between border-b px-7 py-[25px] max-[720px]:px-5"
          style={{ borderColor: "var(--sc-rule)" }}
        >
          <div>
            <strong style={{ ...serifFont, color: "var(--sc-ink)" }}>
              18 Sermons Evaluated
            </strong>
            <br />
            <small
              className="text-[13px]"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Your preaching development
            </small>
          </div>
          <div
            className="text-[28px] font-extrabold"
            style={{ ...uiFont, color: "var(--sc-success)" }}
          >
            ↑ 17%
          </div>
        </div>

        <div className="grid grid-cols-1 min-[721px]:grid-cols-[1.1fr_0.9fr]">
          <div
            className="border-b p-[30px] max-[720px]:px-5 min-[721px]:border-b-0 min-[721px]:border-r"
            style={{ borderColor: "var(--sc-rule)" }}
          >
            <strong style={{ ...serifFont, color: "var(--sc-ink)" }}>
              Overall growth
            </strong>
            <div
              className="mt-5 flex h-[220px] items-end gap-[14px] border-b px-2 pt-5"
              style={{ borderColor: "var(--sc-rule)" }}
            >
              {BAR_HEIGHTS.map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${height}%`,
                    background: "var(--sc-ink)",
                    opacity: 0.86,
                  }}
                />
              ))}
            </div>
            <div
              className="mt-2.5 flex justify-between text-[11px]"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              <span>Sermon 1</span>
              <span>Sermon 10</span>
              <span>Sermon 18</span>
            </div>
          </div>

          <div className="p-[30px] max-[720px]:px-5">
            <strong style={{ ...serifFont, color: "var(--sc-ink)" }}>
              Current profile
            </strong>
            {METRICS.map((metric) => (
              <div key={metric.label} className="my-[18px]">
                <div
                  className="mb-[7px] flex justify-between text-[13px]"
                  style={{ ...uiFont, color: "var(--sc-ink)" }}
                >
                  <span>{metric.label}</span>
                  <b>{metric.score}</b>
                </div>
                <div
                  className="h-2 rounded"
                  style={{ background: "var(--sc-rule)" }}
                >
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${metric.width}%`,
                      background: "var(--sc-ink)",
                    }}
                  />
                </div>
              </div>
            ))}
            <div
              className="mt-[25px] rounded p-5"
              style={{ background: "var(--sc-olive-soft)" }}
            >
              <small
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ ...uiFont, color: "var(--sc-olive)" }}
              >
                NEXT DEVELOPMENT FOCUS
              </small>
              <strong
                className="my-1.5 block text-[20px]"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                Make application concrete.
              </strong>
              <p
                className="m-0 text-[13px] leading-[1.6]"
                style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
              >
                Your exposition is consistently strong. Your next opportunity is
                moving from explanation to specific, memorable practice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
