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

function destinationFromSearch(
  searchParams: ReturnType<typeof useSearchParams>,
): string {
  const checkoutParams = parseCoachCheckoutParams(searchParams);
  const packParams = parsePackCheckoutParams(searchParams);
  if (checkoutParams) return buildCheckoutPath(checkoutParams.cadence);
  if (packParams) return buildPackCheckoutPath(packParams.pack);
  return START_PATH;
}

function readHashSession(): {
  access_token: string;
  refresh_token: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

/**
 * Confirm-email can land on /login with tokens in the URL hash. Middleware
 * never sees the hash. Materialize the session, then hard-navigate to /start
 * so attribution gating runs on a normal request.
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
    const destination = destinationFromSearch(searchParams);

    async function go(dest: string) {
      if (cancelled) return;
      window.location.replace(dest);
    }

    async function handoff() {
      const fromHash = readHashSession();
      if (fromHash) {
        const { error } = await supabase.auth.setSession(fromHash);
        if (!error) {
          // Clear hash before navigating so a refresh doesn't re-process tokens.
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
          );
          await go(destination);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await go(destination);
      }
    }

    void handoff();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        // Avoid fighting an in-progress password login submit that pushes its own destination.
        if (readHashSession() || window.location.hash.includes("access_token")) {
          void go(destination);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, searchParams]);

  return null;
}
