"use client";

import { useRouter } from "next/navigation";
import { SketchReportView } from "@/components/sketch/SketchReportView";
import {
  SKETCH_AREA_LABELS,
  SKETCH_FIELDS,
  type SketchField,
  type SketchStatusMap,
} from "@/lib/sketch/types";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type PublicSampleSketchReportProps = {
  primaryPassage: string | null;
  answers: Record<SketchField, string>;
  readOutput: string;
  status: SketchStatusMap;
};

/**
 * Public-sample wrapper: six submitted answers above the shared report body.
 * Does not change SketchReportView defaults for dashboard / live Sketch runs.
 */
export function PublicSampleSketchReport({
  primaryPassage,
  answers,
  readOutput,
  status,
}: PublicSampleSketchReportProps) {
  const router = useRouter();

  return (
    <div>
      <section className="mx-auto mb-10 max-w-[720px]">
        <h2
          className="mb-2 text-[20px] font-semibold tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          The six answers
        </h2>
        <p
          className="mb-5 text-[14px] leading-relaxed"
          style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
        >
          The Sketch reads these answers for alignment. It is not independent
          exegesis of the passage.
        </p>
        <dl className="space-y-5">
          {SKETCH_FIELDS.map((field) => (
            <div key={field}>
              <dt
                className="mb-1 text-[11px] font-semibold tracking-[0.14em] uppercase"
                style={{ ...uiFont, color: "var(--sc-gold)" }}
              >
                {SKETCH_AREA_LABELS[field]}
              </dt>
              <dd
                className="text-[15px] leading-relaxed whitespace-pre-wrap"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {answers[field].trim() || "Not given"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <SketchReportView
        intake={{
          primary_passage: primaryPassage ?? "",
          ache: answers.ache,
          big_idea: answers.big_idea,
          gospel_turn: answers.gospel_turn,
          points: answers.points,
          one_person: answers.one_person,
          ending: answers.ending,
        }}
        read={readOutput}
        status={status}
        isSignedIn={false}
        onStartAnother={() => {
          router.push("/sketch");
        }}
      />
    </div>
  );
}
