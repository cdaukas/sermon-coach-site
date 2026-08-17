"use client";

import {
  DEFAULT_SCRIPT_ID,
  SCRIPT_URL,
  Turnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";
import Script from "next/script";
import { useCallback, useRef, useState, type RefObject } from "react";
import { turnstileSiteKey } from "@/lib/auth/captcha";

export function useAuthCaptcha() {
  const siteKey = turnstileSiteKey();
  const [token, setToken] = useState("");
  const widgetRef = useRef<TurnstileInstance | null>(null);

  const reset = useCallback(() => {
    setToken("");
    widgetRef.current?.reset();
  }, []);

  return {
    siteKey,
    token,
    setToken,
    widgetRef,
    reset,
    ready: siteKey.length === 0 || token.length > 0,
  };
}

type AuthCaptchaProps = {
  siteKey: string;
  widgetRef: RefObject<TurnstileInstance | null>;
  onToken: (token: string) => void;
};

export function AuthCaptcha({ siteKey, widgetRef, onToken }: AuthCaptchaProps) {
  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script id={DEFAULT_SCRIPT_ID} src={SCRIPT_URL} strategy="afterInteractive" />
      <Turnstile
        ref={widgetRef}
        siteKey={siteKey}
        injectScript={false}
        options={{ appearance: "interaction-only", theme: "light" }}
        onSuccess={onToken}
        onExpire={() => onToken("")}
        onError={() => onToken("")}
      />
    </>
  );
}
