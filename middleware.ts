import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient, isSupabaseConfigured } from "@/lib/supabase";

const PUBLIC_PATHS = new Set(["/login", "/signup"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/webhooks/stripe")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const publicPath = isPublicPath(pathname);

  // If Supabase is not configured yet, skip network calls to placeholder host
  if (!isSupabaseConfigured()) {
    if (publicPath) return response;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { supabase, getResponse } = createSupabaseMiddlewareClient(request, response);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // AuthSessionMissingError is expected when a user does not have an active session
    const isMissingSession =
      !error ||
      error.name === "AuthSessionMissingError" ||
      error.message?.includes("Auth session missing");

    if (error && !isMissingSession) {
      console.warn("Middleware auth error:", error.message);
    }

    response = getResponse();

    if (!user && !publicPath) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user && (pathname === "/login" || pathname === "/signup")) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    if (err?.name !== "AuthSessionMissingError" && !err?.message?.includes("Auth session missing")) {
      console.warn("Middleware exception:", err?.message || error);
    }
    if (isPublicPath(pathname)) return response;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
