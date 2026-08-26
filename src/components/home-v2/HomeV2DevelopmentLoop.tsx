import { Fragment } from "react";

const STEPS = [
  { num: "01", label: "Preach" },
  { num: "02", label: "Evaluate" },
  { num: "03", label: "Learn" },
  { num: "04", label: "Develop" },
  { num: "05", label: "Preach Better" },
] as const;

export function HomeV2DevelopmentLoop() {
  return (
    <section className="section">
      <div className="container center">
        <div className="eyebrow">The preaching development loop</div>
        <h2>Every sermon is an opportunity to grow.</h2>
        <p className="lead">
          Turn isolated sermon feedback into a repeatable process that helps you
          preach, evaluate, learn, develop, and preach better.
        </p>
        <div className="steps">
          {STEPS.map((step, index) => (
            <Fragment key={step.num}>
              <div className="step">
                <b>{step.num}</b>
                <span>{step.label}</span>
              </div>
              {index < STEPS.length - 1 ? (
                <div className="arrow" aria-hidden>
                  →
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
