import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient, isSupabaseConfigured } from "@/lib/supabase";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/features",
  "/privacy",
  "/terms",
  "/onboarding",
  "/payment/success",
  "/payment/cancelled",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/webhooks/stripe")) return true;
  if (pathname.startsWith("/og")) return true;
  if (pathname.startsWith("/payment/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPath = isPublicPath(pathname);

  // If Supabase is configured, verify Supabase auth
  if (isSupabaseConfigured()) {
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    try {
      const { supabase, getResponse } = createSupabaseMiddlewareClient(request, response);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      response = getResponse();

      if (user) {
        if (pathname === "/login" || pathname === "/signup") {
          const dashboardUrl = request.nextUrl.clone();
          dashboardUrl.pathname = "/search";
          dashboardUrl.search = "";
          return NextResponse.redirect(dashboardUrl);
        }
        return response;
      }
    } catch {
      // Fall through to unauthenticated flow
    }
  }

  // Allow public paths (e.g. /login, /signup)
  if (publicPath) {
    return NextResponse.next();
  }

  // When Supabase is not configured, allow testing in standalone guest/demo mode
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  // Reject unauthorized API requests
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect unauthenticated dashboard requests to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}
