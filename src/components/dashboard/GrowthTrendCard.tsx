import { GrowthTrendChart } from "./GrowthTrendChart";
import {
  getDisplayBandZones,
  type GrowthTrendPoint,
} from "@/lib/evaluation/growth-trend";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type GrowthTrendCardProps = {
  points: GrowthTrendPoint[];
};

export function GrowthTrendCard({ points }: GrowthTrendCardProps) {
  const showChart = points.length >= 2;
  const zones = showChart ? getDisplayBandZones() : [];

  return (
    <section
      className="mb-8 rounded px-6 py-5"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
      aria-labelledby="growth-trend-heading"
    >
      <h2
        id="growth-trend-heading"
        className="text-[18px] font-semibold"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Your scores over time
      </h2>

      {showChart ? (
        <div className="mt-4">
          <GrowthTrendChart points={points} zones={zones} />
        </div>
      ) : (
        <p
          className="mt-3 text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          Submit a few sermons and your growth shows up here.
        </p>
      )}
    </section>
  );
}
