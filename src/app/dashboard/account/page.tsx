import type { Metadata } from "next";
import Link from "next/link";
import { AccountDetailsForm } from "@/components/dashboard/AccountDetailsForm";
import { AccountEmailPreferencesForm } from "@/components/dashboard/AccountEmailPreferencesForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your account",
};

const uiFont = { fontFamily: "var(--font-ui)" };
const serifFont = { fontFamily: "var(--font-serif)" };

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.trim() || "";

  let displayName = "";
  let churchName = "";
  let newsletterOptedIn = false;
  let tuesdayNudgeOptedIn = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "display_name, church_name, newsletter_opted_in, tuesday_nudge_opted_in",
      )
      .eq("id", user.id)
      .maybeSingle();

    displayName = asTrimmedString(profile?.display_name);
    churchName = asTrimmedString(profile?.church_name);
    newsletterOptedIn = profile?.newsletter_opted_in === true;
    tuesdayNudgeOptedIn = profile?.tuesday_nudge_opted_in === true;
  }

  return (
    <main>
      <div className="mb-8">
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ ...uiFont, color: "var(--sc-accent)" }}
        >
          Account
        </p>
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Your account
        </h1>
      </div>

      <div className="mb-12 grid max-w-4xl gap-12 md:grid-cols-2 md:items-start md:gap-x-14 md:gap-y-0">
        <section aria-labelledby="account-details-heading">
          <h2
            id="account-details-heading"
            className="mb-5 text-[22px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Your details
          </h2>
          <AccountDetailsForm
            initialDisplayName={displayName}
            initialChurchName={churchName}
          />
        </section>

        <section aria-labelledby="account-emails-heading">
          <h2
            id="account-emails-heading"
            className="mb-5 text-[22px] font-semibold leading-tight tracking-tight"
            style={{ ...serifFont, color: "var(--sc-ink)" }}
          >
            Emails
          </h2>
          <AccountEmailPreferencesForm
            email={email || "No email on this account"}
            initialNewsletterOptedIn={newsletterOptedIn}
            initialTuesdayNudgeOptedIn={tuesdayNudgeOptedIn}
          />
          <p className="mt-10">
            <Link
              href="/reset-password"
              className="text-[13px] no-underline hover:underline"
              style={{ ...uiFont, color: "var(--sc-ink-soft)" }}
            >
              Change your password
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
