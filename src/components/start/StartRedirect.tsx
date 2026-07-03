"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { START_DESTINATION } from "@/lib/auth/start";

const uiFont = { fontFamily: "var(--font-ui)" };

export function StartRedirect() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.push(START_DESTINATION);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="flex min-h-full flex-col px-6 py-10"
      style={{ background: "var(--sc-bg)" }}
    >
      <header className="mx-auto w-full max-w-[440px]">
        <Link
          href="/"
          className="inline-block text-xl font-semibold tracking-tight no-underline"
          style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
        >
          The Sermon{" "}
          <span style={{ color: "var(--sc-accent)" }}>Coach</span>™
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
        <div
          className="rounded px-8 py-9 text-center"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
            boxShadow: "var(--sc-shadow-lift)",
          }}
        >
          <p
            className="text-base leading-relaxed"
            style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
          >
            Taking you to your dashboard…
          </p>
        </div>
      </main>
    </div>
  );
}
