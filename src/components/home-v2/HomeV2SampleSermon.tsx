"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

const SUPPORTING =
  "The same Hebrews 3:1–6 sermon is shown at two stages: the Sketch before preaching and the evaluation after. The Sketch caught the gospel turn while it was still in tension. The evaluation found that the turn had been resolved.";

/** Real captures of the product, in the order a preacher meets them: the
 *  Sketch before the manuscript is finished, then the evaluation and the three
 *  reads inside it. Every image is 1680x1197, so the frame never reflows. */
const SLIDES = [
  {
    id: "sketch",
    label: "The Sketch",
    src: "/images/product/01-sketch.png",
    alt: "The Sketch for a sermon on Hebrews 3:1-6, showing the working idea and an at-a-glance read of six answers marked solid or in tension.",
    caption:
      "Check your sermon's direction and structure before the manuscript is finished.",
    href: "/sample-sketch",
    linkLabel: "Read the sample sketch",
  },
  {
    id: "evaluation",
    label: "The Evaluation",
    src: "/images/product/02-evaluation.png",
    alt: "An evaluation category, Application and Audience Connection, with each criterion scored out of five and an expanded note explaining the score.",
    caption:
      "See what's working, what needs attention, and where to focus before you preach.",
    href: "/sample-evaluation",
    linkLabel: "Read the sample evaluation",
  },
  {
    id: "how-it-preaches",
    label: "How It Preaches",
    src: "/images/product/03-how-it-preaches.png",
    alt: "How It Preaches, reading the sermon in five movements from the open through the big idea to the structural logic.",
    caption: "See how the sermon is likely to land in the room.",
  },
  {
    id: "where-its-strong",
    label: "Where It's Strong",
    src: "/images/product/04-where-its-strong.png",
    alt: "Where It's Strong, four cards naming what the sermon did well, each quoting the line from the manuscript that earned it.",
    caption: "See what is already working, and why it is working.",
  },
  {
    id: "where-it-can-grow",
    label: "Where It Can Grow",
    src: "/images/product/05-where-it-can-grow.png",
    alt: "Where You Can Grow, numbered changes in order of leverage, each with a practical step to take before preaching it again.",
    caption:
      "Get the highest-leverage change to make before you preach it again.",
  },
] as const;

export function HomeV2SampleSermon() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  /** Arrow keys move the carousel only while it holds focus, so they keep
   *  working as page scroll everywhere else. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const delta = event.changedTouches[0].clientX - start;
    // Ignore anything short enough to be a tap or a vertical scroll.
    if (Math.abs(delta) < 40) return;
    go(delta < 0 ? index + 1 : index - 1);
  }

  const current = SLIDES[index];

  return (
    <section className="section sample">
      <div className="container center">
        <div className="eyebrow">See it on a real sermon</div>
        <h2>The Sermon Coach in Action.</h2>
        <p className="lead">{SUPPORTING}</p>
      </div>

      <div className="container">
        <div
          className="shots"
          role="group"
          aria-roledescription="carousel"
          aria-label="What Sermon Coach produces"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div
            className="shots-frame"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="shots-track"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {SLIDES.map((slide, i) => (
                <div
                  className="shots-slide"
                  key={slide.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${SLIDES.length}: ${slide.label}`}
                  aria-hidden={i !== index}
                >
                  {/* Plain img to match the rest of the site, which uses no
                      next/image anywhere. Dimensions are on the element so the
                      frame reserves its height before the file arrives. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    width={1680}
                    height={1197}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="shots-arrow shots-prev"
            onClick={() => go(index - 1)}
            aria-label="Previous screen"
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <button
            type="button"
            className="shots-arrow shots-next"
            onClick={() => go(index + 1)}
            aria-label="Next screen"
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* One caption block outside the track, so only the active slide's
            words are in the accessibility tree and the height stays put. */}
        <div className="shots-caption" aria-live="polite">
          <div className="shots-label">{current.label}</div>
          <p>{current.caption}</p>
          {"href" in current && current.href ? (
            <Link href={current.href} className="cardlink">
              {current.linkLabel} &rarr;
            </Link>
          ) : null}
        </div>

        <div className="shots-dots">
          {SLIDES.map((slide, i) => (
            <button
              type="button"
              key={slide.id}
              className={i === index ? "shots-dot is-on" : "shots-dot"}
              onClick={() => go(i)}
              aria-label={`Show ${slide.label}`}
              aria-current={i === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
