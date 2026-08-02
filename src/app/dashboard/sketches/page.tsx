import type { Metadata } from "next";
import Link from "next/link";
import { listReadinessReadsDetailForUser } from "@/lib/sketch/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sketches",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function SketchesLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sketches = user
    ? await listReadinessReadsDetailForUser(user.id)
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ ...uiFont, color: "var(--sc-accent)" }}
          >
            Sketches
          </p>
          <h1
            className="text-[32px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Your sketches
          </h1>
        </div>
        <Link
          href="/dashboard/sketch"
          className="inline-block rounded border px-5 py-2.5 text-[13px] font-semibold tracking-wide no-underline"
          style={{
            ...uiFont,
            background: "var(--sc-ink)",
            color: "var(--sc-bg)",
            borderColor: "var(--sc-ink)",
          }}
        >
          Run The Sketch
        </Link>
      </div>

      {sketches.length === 0 ? (
        <div
          className="text-center"
          style={{
            background: "#ffffff",
            boxShadow: "var(--sc-shadow)",
            borderRadius: 4,
            padding: "46px 40px",
          }}
        >
          <h2
            className="m-0 font-semibold"
            style={{ ...serifFont, fontSize: 25, color: "#1a2332" }}
          >
            No sketches yet
          </h2>
          <p
            className="mx-auto mt-3 mb-0 leading-relaxed"
            style={{
              ...uiFont,
              fontSize: 14,
              color: "#4a5568",
              maxWidth: 400,
            }}
          >
            A sketch is a read on your sermon before you build it. Six questions,
            no score.
          </p>
          <Link
            href="/dashboard/sketch"
            className="mt-6 inline-block rounded border px-7 py-3.5 text-sm font-semibold tracking-wide no-underline"
            style={{
              ...uiFont,
              background: "var(--sc-ink)",
              color: "var(--sc-bg)",
              borderColor: "var(--sc-ink)",
            }}
          >
            Run The Sketch
          </Link>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {sketches.map((sketch) => {
            const passage =
              sketch.primary_passage?.trim() || "Untitled passage";
            const workingIdea = sketch.big_idea?.trim() || null;

            return (
              <li key={sketch.id} className="mb-[9px] last:mb-0">
                <Link
                  href={`/dashboard/sketches/${sketch.id}`}
                  className="block no-underline transition-colors"
                  style={{
                    background: "#ffffff",
                    border: "1px solid #d4cfc1",
                    borderRadius: 4,
                    boxShadow: "var(--sc-shadow)",
                    padding: "15px 18px",
                  }}
                >
                  <p
                    className="m-0 font-semibold leading-tight"
                    style={{
                      ...serifFont,
                      fontSize: 19,
                      letterSpacing: "-0.01em",
                      color: "#1a2332",
                    }}
                  >
                    {passage}
                  </p>
                  {workingIdea ? (
                    <p
                      className="mt-1 mb-0 line-clamp-2"
                      style={{
                        ...serifFont,
                        fontSize: 14,
                        fontStyle: "italic",
                        color: "#4a5568",
                      }}
                    >
                      {workingIdea}
                    </p>
                  ) : null}
                  <p
                    className="mt-2 mb-0"
                    style={{ ...uiFont, fontSize: 13, color: "#4a5568" }}
                  >
                    {formatDate(sketch.created_at)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
