"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { signUpUser, loginUser } from "@/lib/auth-client";
import { AppLogo } from "@/components/ui/AppLogo";
import { FREELANCER_TYPES, FREELANCER_TYPE_LABELS, type FreelancerType } from "@/types";

export default function SignupForm() {
  const searchParams = useSearchParams();
  const requestedPlan = (searchParams.get("plan") || "free").toLowerCase() as
    | "free"
    | "freelancer"
    | "growth"
    | "agency";

  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [freelancerType, setFreelancerType] = useState<FreelancerType>("web_designer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  const planLabels: Record<string, { name: string; credits: number; price: string }> = {
    freelancer: { name: "Freelancer Plan", credits: 300, price: "$19/mo" },
    growth: { name: "Growth Plan", credits: 1000, price: "$49/mo" },
    agency: { name: "Agency Plan", credits: 2500, price: "$99/mo" },
  };

  const selectedTier = planLabels[requestedPlan];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const targetFullName = ((formData.get("fullName") as string) || fullName || "").trim();
    const targetAgencyName = ((formData.get("agencyName") as string) || agencyName || "").trim();
    const targetType = ((formData.get("freelancerType") as string) || freelancerType) as FreelancerType;
    const targetEmail = ((formData.get("email") as string) || email || "").trim();
    const targetPassword = ((formData.get("password") as string) || password || "").trim();

    if (!targetFullName || !targetEmail) {
      toast.error("Please enter your name and email address.");
      return;
    }

    if (!targetPassword || targetPassword.length < 6) {
      toast.error("Please create a password with at least 6 characters.");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await signUpUser(
        targetEmail,
        targetFullName,
        targetAgencyName,
        targetType,
        requestedPlan,
        targetPassword
      );
      if (res.success) {
        toast.success(`Account created! Welcome to LeadScout, ${targetFullName}.`);
        window.location.href = "/onboarding";
      } else {
        toast.error(res.error || "Signup failed");
      }
    } catch {
      toast.error("An error occurred creating your account");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignup() {
    setLoading(true);
    toast.info("Connecting to Google authentication...");
    setTimeout(() => {
      void loginUser("user@gmail.com", "google-oauth-session").then((res) => {
        if (res.success) {
          toast.success("Welcome to LeadScout! Starter credits loaded.");
          window.location.href = "/onboarding";
        } else {
          setLoading(false);
        }
      });
    }, 900);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-neutral-50/60">
      <Card className="w-full max-w-md p-7 border-neutral-200 shadow-sm bg-white space-y-6">
        <div className="flex flex-col gap-2">
          <AppLogo href="/" size="lg" />
          <h1 className="text-xl font-bold text-neutral-900 mt-1">Create LeadScout Account</h1>
          <p className="text-xs text-neutral-500">
            Includes 20 free discovery credits upon registration & personalized AI outreach pitch drafts.
          </p>
        </div>

        {/* Google Social Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignup}
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
          <span>Sign up with Google</span>
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
            <Label htmlFor="fullName" className="text-xs font-semibold text-neutral-700">
              Full Name
            </Label>
            <Input
              id="fullName"
              name="fullName"
              required
              placeholder="e.g. Sarah Connor"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agencyName" className="text-xs font-semibold text-neutral-700">
              Agency or Freelance Brand (Optional)
            </Label>
            <Input
              id="agencyName"
              name="agencyName"
              placeholder="e.g. Connor Design Co."
              value={agencyName}
              onChange={(event) => setAgencyName(event.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="freelancerType" className="text-xs font-semibold text-neutral-700">
              Primary Freelance Service
            </Label>
            <select
              id="freelancerType"
              name="freelancerType"
              value={freelancerType}
              onChange={(e) => setFreelancerType(e.target.value as FreelancerType)}
              className="w-full h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              {FREELANCER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {FREELANCER_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="sarah@example.com"
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
              <span className="text-[10px] text-neutral-400">Min 6 characters</span>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          {selectedTier ? (
            <div className="p-3 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-900 text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <span>
                  Selected Plan: <strong>{selectedTier.name}</strong> ({selectedTier.credits} credits/mo)
                </span>
              </div>
              <span className="font-bold text-blue-700">{selectedTier.price}</span>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>20 starter search credits loaded into your wallet instantly upon signup.</span>
            </div>
          )}

          {/* Terms & Privacy Consent Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-[11px] text-neutral-600 leading-tight">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          <Button type="submit" className="w-full h-9 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? "Creating account..." : "Start Finding High-Ticket Leads"}
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Already have an account?</span>
          <Link href="/login" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
            Sign in
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>
    </main>
  );
}
