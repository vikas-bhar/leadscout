import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export { createSupabaseBrowserClient };

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

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
  const { url, anonKey } = getPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

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
  // If Supabase is configured, check Supabase auth
  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();

      if (!error && data?.user) {
        return data.user;
      }
    } catch {
      // Fall through
    }
  }

  return null;
}

export async function requireApiUser(): Promise<
  | { user: User; supabase: SupabaseClient }
  | { user: null; supabase: SupabaseClient; response: NextResponse }
> {
  const supabase = createSupabaseServerClient();
  const authUser = await getAuthenticatedUser();

  if (authUser) {
    return { user: authUser, supabase };
  }

  return {
    user: null,
    supabase,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
