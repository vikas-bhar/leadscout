"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Compass, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { signUpUser } from "@/lib/auth-client";
import { FREELANCER_TYPES, FREELANCER_TYPE_LABELS, type FreelancerType } from "@/types";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [freelancerType, setFreelancerType] = useState<FreelancerType>("web_designer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const targetFullName = ((formData.get("fullName") as string) || fullName || "").trim();
    const targetAgencyName = ((formData.get("agencyName") as string) || agencyName || "").trim();
    const targetType = ((formData.get("freelancerType") as string) || freelancerType) as FreelancerType;
    const targetEmail = ((formData.get("email") as string) || email || "").trim();

    if (!targetFullName || !targetEmail) {
      toast.error("Please enter your name and email");
      return;
    }

    setLoading(true);
    try {
      const res = await signUpUser(targetEmail, targetFullName, targetAgencyName, targetType);
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

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 bg-neutral-50/60">
      <Card className="w-full max-w-md p-7 border-neutral-200 shadow-sm bg-white space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Create Freelancer Account</h1>
            <p className="text-xs text-neutral-500">Includes 100 free discovery credits & customized outreach pitch templates.</p>
          </div>
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
              className="w-full h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
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
            <Label htmlFor="password" className="text-xs font-semibold text-neutral-700">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a secure password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              className="h-9 text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>100 starter search credits loaded into your wallet instantly upon signup.</span>
          </div>

          <Button type="submit" className="w-full h-9 text-xs font-semibold gap-1.5" disabled={loading}>
            {loading ? "Creating account..." : "Start Finding High-Ticket Leads"}
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <span>Already have an account?</span>
          <Link href="/login" className="text-primary font-semibold hover:underline flex items-center gap-1">
            Sign in
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </Card>
    </main>
  );
}
