"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginUser } from "@/lib/auth-client";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/";
  const nextPath = rawNext === "/login" || rawNext === "/signup" ? "/" : rawNext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(
    () => "Sign in to find high-opportunity client leads with digital gaps and tailored outreach pitches.",
    []
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const targetEmail = ((formData.get("email") as string) || email || "").trim();
    const targetPassword = ((formData.get("password") as string) || password || "").trim();

    if (!targetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(targetEmail, targetPassword);
      if (res.success) {
        toast.success(`Signed in successfully!`);
        window.location.href = nextPath;
      } else {
        toast.error(res.error || "Login failed");
      }
    } catch {
      toast.error("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-neutral-50/60">
      <Card className="w-full max-w-md p-7 border-neutral-200 shadow-sm bg-white space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Sign in to FreelanceFind</h1>
            <p className="text-xs text-neutral-500">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-neutral-700">
                Password
              </Label>
              <span className="text-[10px] text-neutral-400">Optional for demo</span>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          <Button type="submit" className="w-full h-9 text-xs font-semibold gap-1.5" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to Dashboard"}
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Need a new account?</span>
          <Link href="/signup" className="text-primary font-semibold hover:underline flex items-center gap-1">
            Create account
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>
    </main>
  );
}
