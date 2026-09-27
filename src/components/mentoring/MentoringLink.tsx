"use client";

import { track } from "@vercel/analytics";

const EVENTS = {
  apprentice: "Apprentice CTA clicked",
  colleague: "Colleague CTA clicked",
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
        if (event) {
          track(EVENTS[event]);
        }
      }}
    >
      {children}
    </a>
  );
}
