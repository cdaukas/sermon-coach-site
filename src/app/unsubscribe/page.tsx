import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: "noindex",
};

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <UnsubscribeShell
        title="Invalid unsubscribe link"
        message="This link is missing a token. Use the unsubscribe link from a blog email."
      />
    );
  }

  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return (
      <UnsubscribeShell
        title="Invalid unsubscribe link"
        message="This link is invalid or has expired. Use the unsubscribe link from a blog email."
      />
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("email_suppressions").upsert(
    {
      email,
      reason: "unsubscribe",
      unsubscribed_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    return (
      <UnsubscribeShell
        title="Something went wrong"
        message="We could not save your unsubscribe request. Email Chris at chris@sermoncoach.online and he will remove you manually."
      />
    );
  }

  return (
    <UnsubscribeShell
      title="You are unsubscribed"
      message={`${email} will no longer receive weekly blog emails from The Sermon Coach.`}
    />
  );
}

function UnsubscribeShell({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div
      className="flex min-h-full flex-col px-6 py-10"
      style={{ background: "var(--sc-bg)" }}
    >
      <main className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center py-10">
        <div
          className="rounded px-8 py-9 text-center"
          style={{
            background: "var(--sc-panel)",
            border: "1px solid var(--sc-rule)",
            boxShadow: "var(--sc-shadow-lift)",
          }}
        >
          <h1
            className="mb-4 text-[28px] font-semibold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--sc-ink)" }}
          >
            {title}
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ fontFamily: "var(--font-ui)", color: "var(--sc-ink-soft)" }}
          >
            {message}
          </p>
        </div>
      </main>
    </div>
  );
}
