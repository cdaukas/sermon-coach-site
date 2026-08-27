const ALT =
  "The preaching rhythm in two rows. Top row: pray and study, then sketch the outline with The Sermon Coach, then write the sermon. Bottom row: strengthen the manuscript with The Sermon Coach, then preach the sermon, then keep growing from the transcript with The Sermon Coach.";

/**
 * "Where it fits your week" — the visual development loop.
 *
 * `preaching-rhythm-flow-stacked.svg` is the two-row desktop composition,
 * reflowed from the primitives of the shipped `preaching-rhythm-flow.svg`
 * (same icons, flames, arrows, type and palette) so no new visual language is
 * introduced. The live homepage's own asset is left untouched. Narrow screens
 * keep the existing vertical `-mobile.svg`.
 *
 * No cross-row connector by design: the original marketing artwork stacks the
 * rows without one, and the numbered badges carry the sequence.
 */
export function HomeV2PreachingRhythm() {
  return (
    <section className="section rhythm">
      <div className="container center">
        <div className="eyebrow">Where it fits your week</div>
        <h2>
          The Sermon Coach doesn&rsquo;t replace the work.
          <br />
          It refines it.
        </h2>
        <p className="lead">
          Your study, your writing, your preaching, and the Spirit&rsquo;s work
          in all of it stay yours. The Sermon Coach is the refinery in between.
        </p>
      </div>

      <div className="container">
        <figure className="rhythm-figure">
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="/preaching-rhythm-flow-mobile.svg"
            />
            {/* Plain img on purpose: next/image cannot express <picture> art direction. */}
            <img src="/preaching-rhythm-flow-stacked.svg" alt={ALT} />
          </picture>
        </figure>
      </div>

      <div className="container center">
        <p className="closer">
          Evaluation is one step in the development system, not the destination.
        </p>
      </div>
    </section>
  );
}
