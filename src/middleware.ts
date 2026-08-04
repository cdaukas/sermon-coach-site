import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isDashboardPath,
  needsAcquisitionAttribution,
} from "@/lib/auth/acquisition-gate";
import { START_PATH } from "@/lib/auth/start";

/** Request header so Server Components can omit dashboard chrome for PDF export. */
const PDF_CAPTURE_HEADER = "x-sc-pdf-capture";

function nextWithRequestHeaders(request: NextRequest): NextResponse {
  const requestHeaders = new Headers(request.headers);
  if (request.nextUrl.searchParams.get("pdf") === "1") {
    requestHeaders.set(PDF_CAPTURE_HEADER, "1");
  }
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = nextWithRequestHeaders(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = nextWithRequestHeaders(request);
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isDashboardPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname.startsWith("/login/") ||
      pathname.startsWith("/signup/"))
  ) {
    const plan = request.nextUrl.searchParams.get("plan");
    const cadence = request.nextUrl.searchParams.get("cadence");

    if (plan === "coach" && (cadence === "monthly" || cadence === "annual")) {
      const url = request.nextUrl.clone();
      url.pathname = "/checkout";
      return NextResponse.redirect(url);
    }

    // Already signed in: /login must settle on /dashboard (not /start).
    // /start is the getting-started surface and bounces settled users onward,
    // which paired with this redirect produced a login↔start loop.
    // Attribution-unanswered users still hit /start via the dashboard gate below.
    // /signup keeps routing through /start so first-time handoff is unchanged.
    const url = request.nextUrl.clone();
    const onLogin =
      pathname === "/login" || pathname.startsWith("/login/");
    url.pathname = onLogin ? "/dashboard" : START_PATH;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && isDashboardPath(pathname)) {
    const needsAttribution = await needsAcquisitionAttribution(supabase);
    if (needsAttribution) {
      const url = request.nextUrl.clone();
      url.pathname = START_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Exclude public Sketch page + /api/sketch/* (no session). Keep
    // /dashboard/sketch and /api/readiness-read in the matcher.
    "/((?!_next/static|_next/image|favicon.ico|sketch(?:/|$)|api/sketch(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
