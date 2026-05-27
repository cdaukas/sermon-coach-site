import type { ComponentPropsWithoutRef } from "react";

const uiFont = { fontFamily: "var(--font-ui)" };

type AuthFormProps = ComponentPropsWithoutRef<"form">;

export function AuthForm({ className = "", ...props }: AuthFormProps) {
  return (
    <form
      className={`flex flex-col gap-5 ${className}`.trim()}
      {...props}
    />
  );
}

type AuthLabelProps = ComponentPropsWithoutRef<"label">;

export function AuthLabel({ className = "", ...props }: AuthLabelProps) {
  return (
    <label
      className={`block text-[13px] font-medium tracking-wide ${className}`.trim()}
      style={{ ...uiFont, color: "var(--sc-ink-mid)" }}
      {...props}
    />
  );
}

type AuthInputProps = ComponentPropsWithoutRef<"input">;

export function AuthInput({ className = "", ...props }: AuthInputProps) {
  return (
    <input
      className={`w-full rounded border px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-[var(--sc-accent)] focus:ring-2 focus:ring-[var(--sc-accent)]/20 ${className}`.trim()}
      style={{
        ...uiFont,
        background: "var(--sc-panel)",
        borderColor: "var(--sc-rule)",
        color: "var(--sc-ink)",
      }}
      {...props}
    />
  );
}

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  inputProps: AuthInputProps;
};

export function AuthField({ id, label, error, inputProps }: AuthFieldProps) {
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <AuthLabel htmlFor={id}>{label}</AuthLabel>
      <AuthInput
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <p
          id={describedBy}
          className="text-[13px]"
          style={{ ...uiFont, color: "var(--sc-error)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type AuthSubmitProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary";
};

export function AuthSubmit({
  variant = "primary",
  className = "",
  disabled,
  ...props
}: AuthSubmitProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full rounded border px-7 py-3.5 text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      style={{
        ...uiFont,
        background: isPrimary ? "var(--sc-ink)" : "var(--sc-panel)",
        color: isPrimary ? "var(--sc-bg)" : "var(--sc-ink)",
        borderColor: isPrimary ? "var(--sc-ink)" : "var(--sc-rule)",
        boxShadow: isPrimary ? "none" : undefined,
      }}
      {...props}
    />
  );
}

type AuthLinkProps = ComponentPropsWithoutRef<"a">;

export function AuthLink({ className = "", ...props }: AuthLinkProps) {
  return (
    <a
      className={`text-[13px] font-medium underline-offset-2 hover:underline ${className}`.trim()}
      style={{ ...uiFont, color: "var(--sc-accent)" }}
      {...props}
    />
  );
}
