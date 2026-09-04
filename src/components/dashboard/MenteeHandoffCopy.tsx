"use client";

import { menteeHandoffSentences } from "@/lib/mentor/mentee-reads";

const uiFont = { fontFamily: "var(--font-ui)" };

/**
 * Dark Apprentice handoff. The product does not speak to them; everything
 * reaches them through their pastor. Three sentences. Nothing else.
 */
export function MenteeHandoffCopy({ mentorName }: { mentorName: string }) {
  const sentences = menteeHandoffSentences(mentorName);

  return (
    <div className="mb-6">
      {sentences.map((sentence, index) => (
        <p
          key={sentence}
          className={`text-[15px] leading-relaxed${index > 0 ? " mt-3" : ""}`}
          style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
        >
          {sentence}
        </p>
      ))}
    </div>
  );
}
