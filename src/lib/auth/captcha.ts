/** Public Turnstile site key. Empty means the widget is omitted (local/dev). */
export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export function withCaptchaToken<T extends Record<string, unknown>>(
  options: T,
  token: string,
): T & { captchaToken?: string } {
  const trimmed = token.trim();
  if (!trimmed) {
    return options;
  }
  return { ...options, captchaToken: trimmed };
}
