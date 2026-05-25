const serifFont = { fontFamily: "var(--font-serif)" };

type SermonManuscriptProps = {
  content: string;
};

export function SermonManuscript({ content }: SermonManuscriptProps) {
  return (
    <div
      className="rounded border px-5 py-4 text-[15px] leading-relaxed whitespace-pre-wrap"
      style={{
        ...serifFont,
        background: "var(--sc-bg)",
        borderColor: "var(--sc-rule)",
        color: "var(--sc-ink)",
      }}
    >
      {content}
    </div>
  );
}
