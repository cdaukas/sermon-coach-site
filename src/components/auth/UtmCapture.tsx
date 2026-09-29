"use client";

import { useEffect } from "react";
import { firstTouchUtmCookie } from "@/lib/auth/utm-capture";

/**
 * First-touch UTM cookie for Next pages. Static HTML uses public/utm-capture.js
 * with the same cookie name, lifetime, and fields.
 */
export function UtmCapture() {
  useEffect(() => {
    const cookie = firstTouchUtmCookie(
      window.location.search,
      window.location.pathname,
      document.cookie,
    );
    if (cookie) {
      document.cookie = cookie;
    }
  }, []);

  return null;
}
