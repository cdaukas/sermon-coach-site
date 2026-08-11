"use client";

import { useRouter } from "next/navigation";
import { SketchReportView } from "@/components/sketch/SketchReportView";
import type { ReadinessReadRow } from "@/lib/sketch/readiness-read";
import { statusMapFromRow } from "@/lib/sketch/readiness-read";

type SketchReadClientProps = {
  sketch: ReadinessReadRow;
};

export function SketchReadClient({ sketch }: SketchReadClientProps) {
  const router = useRouter();

  return (
    <SketchReportView
      intake={{
        primary_passage: sketch.primary_passage ?? "",
        outline_form: "manuscript",
        ache: sketch.ache,
        big_idea: sketch.big_idea,
        gospel_turn: sketch.gospel_turn,
        points: sketch.points,
        one_person: sketch.one_person,
        ending: sketch.ending,
      }}
      read={sketch.read_output}
      status={statusMapFromRow(sketch)}
      isSignedIn
      onStartAnother={() => {
        router.push("/dashboard/sketch");
      }}
    />
  );
}
