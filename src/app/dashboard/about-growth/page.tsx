import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  GrowthLockedCheckoutButton,
  GrowthLockedView,
} from "@/components/dashboard/GrowthLockedOffer";
import { profileHasGrowthAccess } from "@/lib/growth/access";
import { createClient } from "@/lib/supabase/server";

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

export const metadata: Metadata = {
  title: "Growth — The Sermon Coach",
  robots: { index: false, follow: false },
};

export default async function AboutGrowthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard/about-growth");
  }

  if (await profileHasGrowthAccess(user.id)) {
    redirect("/dashboard/growth");
  }

  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8"
    >
      <GrowthLockedView />
      <h1
        className="text-[32px] font-semibold leading-tight tracking-tight md:text-[36px]"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Growth
      </h1>
      <p
        className="mt-3 max-w-[42ch] text-[18px] leading-snug"
        style={{ ...serifFont, color: "var(--sc-ink)" }}
      >
        Your preaching across sermons, not one at a time.
      </p>
      <p
        className="mt-6 max-w-[52ch] text-[16px] leading-relaxed"
        style={{ ...serifFont, color: "var(--sc-ink-soft)" }}
      >
        One evaluation reads one sermon. Growth reads them together and shows
        what keeps rising, what keeps sagging, and where to put your effort.
        At four evaluated sermons you get a prep card, one page for Saturday.
        At six, your growth line draws.
      </p>
      <p
        className="mt-6 text-[15px] leading-relaxed"
        style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
      >
        Included with Coach, $29 a month.
      </p>
      <GrowthLockedCheckoutButton />
    </main>
  );
}
