import Link from "next/link";

const uiFont = { fontFamily: "var(--font-ui)" };

type NewEvaluationButtonProps = {
  className?: string;
};

/** Page-head primary: open the evaluation submit form. */
export function NewEvaluationButton({ className }: NewEvaluationButtonProps) {
  return (
    <Link
      href="/dashboard/sermons/new"
      className={className}
      style={{
        ...uiFont,
        display: "inline-block",
        flexShrink: 0,
        fontSize: 13,
        fontWeight: 600,
        background: "#1a2332",
        color: "#faf8f3",
        borderRadius: 4,
        padding: "10px 18px",
        textDecoration: "none",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
      }}
    >
      New evaluation
    </Link>
  );
}
