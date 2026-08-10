/**
 * Visually off-screen trap field. type=text (not hidden) so naive bots fill it.
 * Screen readers and keyboard skip via aria-hidden + tabIndex=-1.
 */
export function SignupHoneypotField({
  id = "signup-website",
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
    >
      <label htmlFor={id}>Website</label>
      <input
        id={id}
        name="website"
        type="text"
        autoComplete="off"
        tabIndex={-1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
