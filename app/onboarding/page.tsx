import { Suspense } from "react";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading LeadScout...</span>
          </div>
        </div>
      }
    >
      <OnboardingClient />
    </Suspense>
  );
}
