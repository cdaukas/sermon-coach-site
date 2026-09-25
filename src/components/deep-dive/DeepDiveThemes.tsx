import Link from "next/link";
import { serifFont, uiFont } from "@/components/evaluation/shared";
import { PREP_THEME_QUESTION } from "@/lib/prep-card/copy";
import {
  formatDeepDiveDay,
  type DeepDiveThemeId,
} from "@/lib/prep-card/deep-dive-dashboard";
import { themeDisplayName, type MovementThemeId } from "@/lib/movement/themes";

function deepDiveListName(id: MovementThemeId): string {
  if (id === "ask") {
    return "Application";
  }
  if (id === "christ") {
    return "Gospel Centrality — Christ in the sermon";
  }
  return themeDisplayName(id);
}

const THEMES: Array<{
  id: MovementThemeId;
  question: string | null;
  available: boolean;
}> = [
  { id: "ask", question: PREP_THEME_QUESTION.ask, available: true },
  { id: "christ", question: PREP_THEME_QUESTION.christ, available: true },
  { id: "room", question: null, available: false },
  { id: "delight", question: null, available: false },
];

export function DeepDiveThemes({
  lastRunAt,
  now = new Date(),
}: {
  lastRunAt: Record<DeepDiveThemeId, string | null>;
  now?: Date;
}) {
  return (
    <div className="deep-dive-themes">
      <ul className="deep-dive-theme-list">
      {THEMES.map((theme) => {
        const ranAt =
          theme.id === "ask" || theme.id === "christ" ? lastRunAt[theme.id] : null;
        return (
          <li key={theme.id} className="deep-dive-theme-row">
            <div>
              <p
                className="deep-dive-theme-name-text m-0 text-[18px]"
                style={{ ...serifFont, color: "var(--sc-ink)" }}
              >
                {deepDiveListName(theme.id)}
              </p>
              {ranAt ? (
                <p className="mt-1 text-[13px]" style={{ ...uiFont, color: "var(--sc-ink-soft)" }}>
                  Last run {formatDeepDiveDay(new Date(ranAt), now)}
                </p>
              ) : null}
            </div>
            {theme.question ? (
              <p
                className="deep-dive-theme-question m-0 text-[15px] leading-relaxed"
                style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
              >
                {theme.question}
              </p>
            ) : (
              <p className="deep-dive-theme-question deep-dive-theme-question--empty" />
            )}
            {theme.available ? (
              <Link
                href={`/dashboard/deep-dive?theme=${theme.id}`}
                className="deep-dive-theme-action text-[14px] font-semibold no-underline hover:underline"
                style={{ ...uiFont, color: "var(--sc-accent)" }}
              >
                Run this
              </Link>
            ) : (
              <span
                className="deep-dive-theme-action text-[13px]"
                style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
              >
                Coming
              </span>
            )}
          </li>
        );
      })}
      </ul>
    </div>
  );
}
