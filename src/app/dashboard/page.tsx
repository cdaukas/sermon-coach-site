import { SermonList } from "@/components/dashboard/SermonList";
import { listSermons } from "@/lib/sermons/queries";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export default async function DashboardPage() {
  const sermons = await listSermons();

  return (
    <main
      className="rounded px-8 py-10"
      style={{
        background: "var(--sc-panel)",
        border: "1px solid var(--sc-rule)",
        boxShadow: "var(--sc-shadow-lift)",
      }}
    >
      <div className="mb-8">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Dashboard
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Your sermons
        </h1>
      </div>

      <SermonList sermons={sermons} />
    </main>
  );
}
