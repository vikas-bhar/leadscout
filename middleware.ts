import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase";

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

  try {
    const { supabase, getResponse } = createSupabaseMiddlewareClient(request, response);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.log("middleware auth error", error);
    }

    response = getResponse();

    const publicPath = isPublicPath(pathname);

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
  } catch (error) {
    console.log("middleware exception", error);
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
