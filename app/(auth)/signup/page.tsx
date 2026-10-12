import { Metadata } from "next";
import { Suspense } from "react";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Sign up for LeadScout with 20 free discovery credits. Find freelance clients who need websites, Instagram growth, and digital fixes.",
  alternates: {
    canonical: "https://leadscout-ashy.vercel.app/signup",
  },
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-neutral-500">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading LeadScout...</span>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
