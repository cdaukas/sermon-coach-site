import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DigestAuthUser,
  DigestEval,
  DigestGrant,
  DigestProfile,
} from "./digest";

const PAGE_SIZE = 1000;

type AuthAdminClient = {
  auth: {
    admin: {
      listUsers: (params: {
        page: number;
        perPage: number;
      }) => Promise<{
        data: {
          users: Array<{
            id: string;
            email_confirmed_at?: string | null;
          }>;
        };
        error: { message: string } | null;
      }>;
    };
  };
};

async function selectAll<T>(
  label: string,
  queryPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`${label} failed: ${error.message}`);
    }
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return rows;
}

export async function loadDigestProfiles(
  supabase: SupabaseClient,
): Promise<DigestProfile[]> {
  return selectAll("profiles", (from, to) =>
    supabase
      .from("profiles")
      .select(
        "id, display_name, normalized_email, plan_tier, subscription_status, subscription_interval, current_period_end, last_evaluation_at, created_at",
      )
      .order("id", { ascending: true })
      .range(from, to),
  );
}

export async function loadDigestEvals(
  supabase: SupabaseClient,
): Promise<DigestEval[]> {
  return selectAll("sermon_evaluations", (from, to) =>
    supabase
      .from("sermon_evaluations")
      .select("owner_id, created_at")
      .order("created_at", { ascending: true })
      .range(from, to),
  );
}

export async function loadDigestGrants(
  supabase: SupabaseClient,
): Promise<DigestGrant[]> {
  return selectAll("eval_credit_grants", (from, to) =>
    supabase
      .from("eval_credit_grants")
      .select("user_id, quantity_remaining, expires_at")
      .gt("quantity_remaining", 0)
      .not("expires_at", "is", null)
      .order("expires_at", { ascending: true })
      .range(from, to),
  );
}

export async function loadDigestAuthUsers(
  supabase: AuthAdminClient,
): Promise<DigestAuthUser[]> {
  const rows: DigestAuthUser[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) {
      throw new Error(`auth.admin.listUsers failed: ${error.message}`);
    }
    for (const authUser of data.users) {
      rows.push({
        id: authUser.id,
        email_confirmed_at: authUser.email_confirmed_at ?? null,
      });
    }
    if (data.users.length < PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  return rows;
}
