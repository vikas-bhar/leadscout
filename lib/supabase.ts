import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export { createSupabaseBrowserClient };

function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

export function createSupabaseServerClient(): SupabaseClient {
  const { url, anonKey } = getPublicSupabaseEnv();
  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          console.log("Supabase cookie set skipped in Server Component", error);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          console.log("Supabase cookie remove skipped in Server Component", error);
        }
      },
    },
  });
}

export function createSupabaseServiceClient(): SupabaseClient {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  if (typeof window !== "undefined") {
    throw new Error("Service role client cannot be used in the browser");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseMiddlewareClient(request: NextRequest, response: NextResponse) {
  const { url, anonKey } = getPublicSupabaseEnv();
  let currentResponse = response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        currentResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        currentResponse.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        currentResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        currentResponse.cookies.set({ name, value: "", ...options });
      },
    },
  });

  return {
    supabase,
    getResponse: () => currentResponse,
  };
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.log("getAuthenticatedUser error", error);
    return null;
  }

  return data.user ?? null;
}

export async function requireApiUser(): Promise<
  | { user: User; supabase: SupabaseClient }
  | { user: null; supabase: SupabaseClient; response: NextResponse }
> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    console.log("requireApiUser unauthorized", error);
    return {
      user: null,
      supabase,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user: data.user, supabase };
}
