import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isDashboardPath,
  needsAcquisitionAttribution,
} from "@/lib/auth/acquisition-gate";
import { START_PATH } from "@/lib/auth/start";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
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

    const url = request.nextUrl.clone();
    url.pathname = START_PATH;
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
