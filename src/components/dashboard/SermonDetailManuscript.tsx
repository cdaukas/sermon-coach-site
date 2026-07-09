"use client";

import { SermonManuscript } from "@/components/dashboard/SermonManuscript";

const uiFont = { fontFamily: "var(--font-ui)" };

type SermonDetailManuscriptProps = {
  content: string;
};

export function SermonDetailManuscript({ content }: SermonDetailManuscriptProps) {
  return (
    <details className="group mt-6">
      <summary
        className="cursor-pointer list-none text-[13px] font-medium underline-offset-2 transition-colors hover:underline [&::-webkit-details-marker]:hidden"
        style={{ ...uiFont, color: "var(--sc-accent)" }}
      >
        View manuscript
      </summary>
      <div className="mt-4">
        <SermonManuscript content={content} />
      </div>
    </details>
  );
}
