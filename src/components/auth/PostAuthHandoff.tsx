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
  fallback: string,
): string {
  const checkoutParams = parseCoachCheckoutParams(searchParams);
  const packParams = parsePackCheckoutParams(searchParams);
  if (checkoutParams) return buildCheckoutPath(checkoutParams.cadence);
  if (packParams) return buildPackCheckoutPath(packParams.pack);
  const next = searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
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
 *
 * Already-authenticated visitors who reach /login (cookie session, no hash)
 * go to /dashboard instead — /start is not a terminal page for them and used
 * to bounce back into the auth handoff loop.
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
    const onLogin =
      pathname === "/login" || pathname.startsWith("/login/");
    // Hash/confirm handoff still enters via /start (attribution + claim).
    const postConfirmDestination = destinationFromSearch(
      searchParams,
      START_PATH,
    );
    // Cookie session already present on /login: settle on dashboard
    // (middleware may still send unanswered attribution users to /start).
    // /signup keeps the prior /start handoff.
    const alreadyAuthedDestination = destinationFromSearch(
      searchParams,
      onLogin ? "/dashboard" : START_PATH,
    );

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
          await go(postConfirmDestination);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await go(alreadyAuthedDestination);
      }
    }

    void handoff();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        // Avoid fighting an in-progress password login submit that pushes its own destination.
        if (readHashSession() || window.location.hash.includes("access_token")) {
          void go(postConfirmDestination);
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
