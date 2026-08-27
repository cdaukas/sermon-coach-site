import Link from "next/link";

export function HomeV2StartFree() {
  return (
    <section className="footercta">
      <div className="container">
        <h2>Walk into Sunday knowing you&rsquo;re ready.</h2>
        <p>
          Start with one. Your first evaluation is free — no card, no
          commitment, full evaluation back in minutes.
        </p>
        <Link href="/start" className="btn btn-lg">
          Get Your First Evaluation Free
        </Link>
        <p className="pricingnote">
          After that it is $29 a month for ten credits, an introductory rate
          that stays locked while your subscription is active. Or skip the
          subscription and buy credits in packs instead.{" "}
          <a href="/pricing.html">Full pricing</a>
        </p>
      </div>
    </section>
  );
}
