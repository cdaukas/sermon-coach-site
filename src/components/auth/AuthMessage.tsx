type AuthMessageVariant = "error" | "success";

type AuthMessageProps = {
  variant: AuthMessageVariant;
  children: React.ReactNode;
};

const variantStyles: Record<
  AuthMessageVariant,
  { background: string; color: string; border: string }
> = {
  error: {
    background: "var(--sc-error-bg)",
    color: "var(--sc-error)",
    border: "1px solid rgba(155, 44, 44, 0.25)",
  },
  success: {
    background: "var(--sc-success-bg)",
    color: "var(--sc-success)",
    border: "1px solid rgba(39, 103, 73, 0.25)",
  },
};

export function AuthMessage({ variant, children }: AuthMessageProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className="rounded px-4 py-3 text-sm leading-relaxed"
      style={{
        fontFamily: "var(--font-ui)",
        background: styles.background,
        color: styles.color,
        border: styles.border,
      }}
    >
      {children}
    </div>
  );
}
