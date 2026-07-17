"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { START_PATH } from "@/lib/auth/start";
import {
  buildCheckoutPath,
  parseCoachCheckoutParams,
  parsePackCheckoutParams,
  buildPackCheckoutPath,
} from "@/lib/billing/checkout";
import { createClient } from "@/lib/supabase/client";

/**
 * Confirm-email (and other) hash/token handoffs land on /login without a
 * server round-trip. Once the browser client materializes the session,
 * send the user through /start so attribution gating can run.
 */
export function PostAuthHandoff() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      pathname !== "/login" &&
      pathname !== "/signup" &&
      !pathname.startsWith("/login/") &&
      !pathname.startsWith("/signup/")
    ) {
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    async function handoff() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled || !session) return;

      const checkoutParams = parseCoachCheckoutParams(searchParams);
      const packParams = parsePackCheckoutParams(searchParams);

      const destination = checkoutParams
        ? buildCheckoutPath(checkoutParams.cadence)
        : packParams
          ? buildPackCheckoutPath(packParams.pack)
          : START_PATH;

      window.location.replace(destination);
    }

    void handoff();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        void handoff();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, searchParams]);

  return null;
}
