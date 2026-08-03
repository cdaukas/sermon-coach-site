"use client";

import { SermonManuscript } from "@/components/dashboard/SermonManuscript";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

type SermonDetailManuscriptProps = {
  content: string;
};

export function SermonDetailManuscript({ content }: SermonDetailManuscriptProps) {
  return (
    <details className="group mt-6">
      <summary
        className="flex cursor-pointer items-start gap-3 list-none [&::-webkit-details-marker]:hidden"
        style={{ ...uiFont, color: "var(--sc-ink)" }}
      >
        <span
          aria-hidden="true"
          className="mt-[7px] inline-block h-0 w-0 shrink-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-[#a67c2e] transition-transform group-open:rotate-90"
        />
        <span className="text-[17px] font-semibold" style={serifFont}>
          View manuscript
        </span>
      </summary>
      <div className="mt-4">
        <SermonManuscript content={content} />
      </div>
    </details>
  );
}
