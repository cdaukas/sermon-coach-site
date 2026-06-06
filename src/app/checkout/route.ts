import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  buildSignupPath,
  getCoachStripeCheckoutUrl,
  parseCoachCheckoutParams,
} from "@/lib/billing/checkout";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const checkoutParams = parseCoachCheckoutParams(requestUrl.searchParams);

  if (!checkoutParams) {
    return NextResponse.redirect(new URL("/pricing.html", requestUrl.origin));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.redirect(
      getCoachStripeCheckoutUrl(checkoutParams.cadence),
    );
  }

  return NextResponse.redirect(
    new URL(buildSignupPath(checkoutParams.cadence), requestUrl.origin),
  );
}
