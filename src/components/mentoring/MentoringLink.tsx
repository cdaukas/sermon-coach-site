"use client";

import { track } from "@vercel/analytics";

const EVENTS = {
  apprentice: "Apprentice CTA clicked",
  colleague: "Colleague CTA clicked",
} as const;

const SEAT_TYPE = {
  apprentice: "debrief",
  colleague: "evaluation",
} as const;

export function MentoringLink({
  href,
  className,
  children,
  event,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  event?: keyof typeof EVENTS;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => {
        if (!event) return;
        track(EVENTS[event]);
        if (href.startsWith("/checkout")) {
          track("mentoring_seat_checkout_start", {
            seat_type: SEAT_TYPE[event],
          });
        }
      }}
    >
      {children}
    </a>
  );
}
