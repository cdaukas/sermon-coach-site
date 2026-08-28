"use client";

import { menteeHandoffSentences } from "@/lib/mentor/mentee-reads";

const uiFont = { fontFamily: "var(--font-ui)" };

/**
 * Dark Apprentice handoff. The product does not speak to him; everything
 * reaches him through his pastor. Two sentences. Nothing else.
 */
export function MenteeHandoffCopy({ mentorName }: { mentorName: string }) {
  const [first, second] = menteeHandoffSentences(mentorName);

  return (
    <div className="mb-6">
      <p
        className="text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {first}
      </p>
      <p
        className="mt-3 text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      >
        {second}
      </p>
    </div>
  );
}
