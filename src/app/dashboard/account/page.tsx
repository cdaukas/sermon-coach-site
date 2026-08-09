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

      <section className="mb-12 max-w-xl" aria-labelledby="account-details-heading">
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

      <section className="mb-12 max-w-xl" aria-labelledby="account-emails-heading">
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
      </section>

      <section
        className="mb-12 max-w-xl"
        aria-labelledby="account-plan-password-heading"
      >
        <h2
          id="account-plan-password-heading"
          className="mb-5 text-[22px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Billing and password
        </h2>
        <ul className="m-0 list-none p-0">
          <li>
            <Link
              href="/dashboard/buy"
              className="flex w-full items-center justify-between gap-4 py-4 text-[15px] leading-snug no-underline transition-colors hover:bg-[var(--sc-bg)]"
              style={{ ...uiFont, color: "var(--sc-ink)" }}
            >
              <span>Billing</span>
              <span
                className="shrink-0 text-[13px]"
                style={{ color: "var(--sc-ink-soft)" }}
                aria-hidden
              >
                →
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/reset-password"
              className="flex w-full items-center justify-between gap-4 py-4 text-[15px] leading-snug no-underline transition-colors hover:bg-[var(--sc-bg)]"
              style={{ ...uiFont, color: "var(--sc-ink)" }}
            >
              <span>Change your password</span>
              <span
                className="shrink-0 text-[13px]"
                style={{ color: "var(--sc-ink-soft)" }}
                aria-hidden
              >
                →
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
