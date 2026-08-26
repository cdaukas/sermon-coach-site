import { Fragment } from "react";
import { serifFont, uiFont } from "./fonts";

const STEPS = [
  { num: "01", label: "Preach" },
  { num: "02", label: "Evaluate" },
  { num: "03", label: "Learn" },
  { num: "04", label: "Develop" },
  { num: "05", label: "Preach Better" },
] as const;

export function HomeV2DevelopmentLoop() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-20 text-center max-[720px]:px-5 max-[720px]:py-14">
      <p
        className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        The preaching development loop
      </p>
      <h2
        className="mx-auto mb-[18px] max-w-[760px] text-[36px] font-semibold leading-[1.2] tracking-[-0.01em] max-[720px]:text-[28px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Every sermon is an opportunity to grow.
      </h2>
      <p
        className="mx-auto max-w-[720px] text-[17px] leading-[1.7]"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        Turn isolated sermon feedback into a repeatable process that helps you
        preach, evaluate, learn, develop, and preach better.
      </p>

      <div className="mt-[42px] flex flex-col gap-3 min-[721px]:flex-row min-[721px]:items-center">
        {STEPS.map((step, index) => (
          <Fragment key={step.num}>
            <div
              className="flex-1 rounded px-[18px] py-[25px] text-center"
              style={{
                background: "var(--sc-panel)",
                boxShadow: "var(--sc-shadow)",
              }}
            >
              <b
                className="block text-[13px] tracking-[0.06em]"
                style={{ ...uiFont, color: "var(--sc-accent)" }}
              >
                {step.num}
              </b>
              <span
                className="mt-[9px] block font-semibold"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className="hidden shrink-0 px-1 text-center min-[721px]:block"
                style={{ color: "var(--sc-ink-soft)" }}
                aria-hidden
              >
                →
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
