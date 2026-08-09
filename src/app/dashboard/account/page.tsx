import type { Metadata } from "next";
import Link from "next/link";
import { AccountDetailsForm } from "@/components/dashboard/AccountDetailsForm";
import { AccountNewsletterForm } from "@/components/dashboard/AccountNewsletterForm";
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

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, church_name, newsletter_opted_in")
      .eq("id", user.id)
      .maybeSingle();

    displayName = asTrimmedString(profile?.display_name);
    churchName = asTrimmedString(profile?.church_name);
    newsletterOptedIn = profile?.newsletter_opted_in === true;
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

      <section className="mb-12 max-w-xl" aria-labelledby="account-email-heading">
        <h2
          id="account-email-heading"
          className="mb-5 text-[22px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Email
        </h2>
        <AccountNewsletterForm
          email={email || "No email on this account"}
          initialOptedIn={newsletterOptedIn}
        />
      </section>

      <section className="max-w-xl" aria-labelledby="account-plan-password-heading">
        <h2
          id="account-plan-password-heading"
          className="mb-5 text-[22px] font-semibold leading-tight tracking-tight"
          style={{ ...serifFont, color: "var(--sc-ink)" }}
        >
          Plan and password
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          <li>
            <Link
              href="/dashboard/buy"
              className="text-[15px] font-medium no-underline hover:underline"
              style={{ ...uiFont, color: "var(--sc-accent)" }}
            >
              Plan and credits
            </Link>
          </li>
          <li>
            <Link
              href="/reset-password"
              className="text-[15px] font-medium no-underline hover:underline"
              style={{ ...uiFont, color: "var(--sc-accent)" }}
            >
              Change your password
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
