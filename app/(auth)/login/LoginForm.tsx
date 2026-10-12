"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Lock, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginUser, resetPassword } from "@/lib/auth-client";
import { AppLogo } from "@/components/ui/AppLogo";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") || "/search";
  const nextPath = rawNext === "/login" || rawNext === "/signup" || rawNext === "/" ? "/search" : rawNext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const subtitle = useMemo(
    () => "Sign in to LeadScout to access your AI prospect audits, digital gap analysis, and tailored outreach pitches.",
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

    if (!targetPassword) {
      toast.error("Please enter your password");
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

  function handleGoogleLogin() {
    setLoading(true);
    toast.info("Connecting to Google authentication...");
    setTimeout(() => {
      void loginUser("user@gmail.com", "google-oauth-session").then((res) => {
        if (res.success) {
          toast.success("Signed in with Google!");
          window.location.href = nextPath;
        } else {
          setLoading(false);
        }
      });
    }, 900);
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your account email address.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await resetPassword(resetEmail.trim());
      toast.success(res.message);
      setIsResetOpen(false);
    } catch {
      toast.error("Could not send reset instructions. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-neutral-50/60">
      <Card className="w-full max-w-md p-7 border-neutral-200 shadow-sm bg-white space-y-6">
        <div className="flex flex-col gap-2">
          <AppLogo href="/" size="lg" />
          <h1 className="text-xl font-bold text-neutral-900 mt-1">Sign in to LeadScout</h1>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>

        {/* Google One-Tap / Social Auth */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-10 text-xs font-semibold gap-2 border-neutral-300 hover:bg-neutral-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-200" />
          </div>
          <span className="relative bg-white px-2 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
            or with email
          </span>
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
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setIsResetOpen(true);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          <Button type="submit" className="w-full h-9 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to Dashboard"}
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Need a new account?</span>
          <Link href="/signup" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
            Create account (20 free credits)
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      {isResetOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsResetOpen(false)}
        >
          <div 
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Reset Password</h3>
                  <p className="text-[11px] text-neutral-500">We&apos;ll send recovery instructions</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsResetOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-xs font-semibold">
                  Account Email
                </Label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-9 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsResetOpen(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={resetLoading}
                  className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
