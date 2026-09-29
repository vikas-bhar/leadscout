"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/design-system";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type");
  const credits = params.get("credits");
  const plan = params.get("plan");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const content = {
    credits: {
      emoji: "💎",
      title: `${credits || "Credits"} credits added!`,
      sub: "Your credits are ready to use immediately.",
      features: [
        "Credits remain in your account permanently",
        "Deep Google Maps and Instagram profile scanning",
        "Automated AI business gap audits & pitch decks",
      ],
      cta: "Start searching",
      ctaHref: "/search",
    },
    subscription: {
      emoji: "🎉",
      title: `Welcome to ${plan || "LeadScout"} plan!`,
      sub: "Your monthly subscription is now active.",
      features: getFeatures(plan || "freelancer"),
      cta: "Find your first client",
      ctaHref: "/search",
    },
    upgrade: {
      emoji: "⚡",
      title: `Upgraded to ${plan || "New Plan"}!`,
      sub: "Higher credit allowances and features unlocked.",
      features: getFeatures(plan || "growth"),
      cta: "Start using new features",
      ctaHref: "/search",
    },
  };

  const c = content[type as keyof typeof content] || content.credits;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center p-4">
      {dimensions.width > 0 && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={300}
          colors={["#2563EB", "#10B981", "#F59E0B", "#8B5CF6"]}
        />
      )}

      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-6xl mb-2 animate-bounce">{c.emoji}</div>

        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{c.title}</h1>
        <p className="text-xs text-gray-500 dark:text-neutral-400">{c.sub}</p>

        {c.features.length > 0 && (
          <div className="bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 text-left">
            <p className="text-xs font-bold text-gray-700 dark:text-neutral-300 mb-2.5">
              Now unlocked for you:
            </p>
            <ul className="space-y-2">
              {c.features.map((f: string) => (
                <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-neutral-300">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <Button size="lg" className="w-full" onClick={() => router.push(c.ctaHref)}>
            {c.cta} →
          </Button>

          <button
            onClick={() => router.push("/credits")}
            className="block mx-auto text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer py-1"
          >
            View billing & credit wallet
          </button>
        </div>
      </div>
    </div>
  );
}

function getFeatures(plan: string): string[] {
  const features: Record<string, string[]> = {
    freelancer: [
      "300 credits every month",
      "Gap Analyzer link scanner",
      "Instant customized cold outreach drafts",
    ],
    growth: [
      "1,000 credits every month",
      "Custom AI prompts library",
      "Unlimited CSV lead exports",
      "Monthly credit rollover (up to 500)",
    ],
    agency: [
      "3,000 credits every month",
      "5 team seats",
      "Unlimited credit rollover",
      "Priority customer concierge support",
    ],
  };
  return features[plan] || features.freelancer;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading confirmation...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
