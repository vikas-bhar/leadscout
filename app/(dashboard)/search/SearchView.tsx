"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Briefcase,
  Layers,
  Coins,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import {
  BUSINESS_CATEGORIES,
  FREELANCER_TYPE_LABELS,
  type FreelancerType,
} from "@/types";
import { calculateSearchCost } from "@/lib/credit-calc";
import { saveLocalLeads, saveLocalSearch, deductLocalCredits } from "@/lib/local-store";
import {
  LocationFilter,
  buildSearchLocationString,
  ALL_COUNTRIES,
} from "@/components/search/LocationFilter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SearchViewProps {
  initialAvailableCredits: number;
  initialFreelancerType?: FreelancerType;
}

const PROGRESS_STEPS = [
  { label: "Scanning Google Maps listings & ratings in target location...", duration: 900 },
  { label: "Checking website presence, responsive mobile layout & page speed...", duration: 1100 },
  { label: "Auditing Instagram profiles, follower ratios, and recent Reels...", duration: 1200 },
  { label: "Running AI digital gap analysis & opportunity scoring...", duration: 1100 },
  { label: "Generating personalized outreach pitches and direct messages...", duration: 900 },
  { label: "Building your high-opportunity lead dossier...", duration: 600 },
];

export function SearchView({
  initialAvailableCredits,
  initialFreelancerType = "web_designer",
}: SearchViewProps) {
  const router = useRouter();

  const [freelancerType, setFreelancerType] = useState<FreelancerType>(initialFreelancerType);
  const [businessCategory, setBusinessCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  
  // Country & City selection state
  const [country, setCountry] = useState<string>("UAE");
  const [countryCode, setCountryCode] = useState<string>("AE");
  const [city, setCity] = useState<string>("Dubai");
  const [place, setPlace] = useState<string>("Jumeirah");

  const location = buildSearchLocationString(place, city, country);

  const [resultCount, setResultCount] = useState<number>(10);
  const [availableCredits, setAvailableCredits] = useState<number>(initialAvailableCredits);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const cost = calculateSearchCost(resultCount);
  const hasEnough = availableCredits >= cost.totalCredits;

  async function handleStartSearch(e: React.FormEvent) {
    e.preventDefault();
    const searchTargetLocation = location.trim();
    if (!searchTargetLocation) {
      toast.error("Please select a country and city/area");
      return;
    }

    if (!hasEnough) {
      toast.error(
        `Insufficient credits. You need ${cost.totalCredits} credits, but have ${availableCredits}.`
      );
      return;
    }

    setError(null);
    setIsSearching(true);
    setCurrentStepIndex(0);
    setProgressPercent(15);

    // Simulate realistic multi-step animation while the API call finishes
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < PROGRESS_STEPS.length - 1) {
          const next = prev + 1;
          setProgressPercent(Math.min(95, Math.round(((next + 1) / PROGRESS_STEPS.length) * 100)));
          return next;
        }
        return prev;
      });
    }, 1000);

    try {
      const response = await fetch("/api/search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: searchTargetLocation,
          businessCategory,
          freelancerType,
          resultCount,
          country,
          countryCode,
          city,
          place,
        }),
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete search");
      }

      // Persist in local storage for instant availability and resilience
      if (Array.isArray(data.leads) && data.leads.length > 0) {
        saveLocalLeads(data.leads);
      }
      if (data.search) {
        saveLocalSearch(data.search);
      }
      deductLocalCredits(
        cost.totalCredits,
        `Search for ${businessCategory} in ${searchTargetLocation} (${resultCount} results)`,
        data.searchId
      );

      // Finish progress animation
      setProgressPercent(100);
      setCurrentStepIndex(PROGRESS_STEPS.length - 1);
      toast.success(`Discovered ${data.resultsCount || resultCount} qualified leads!`);

      if (typeof data.newBalance === "number") {
        setAvailableCredits(data.newBalance);
      }

      // Route to Leads page
      setTimeout(() => {
        router.push("/leads");
        router.refresh();
      }, 900);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setIsSearching(false);
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      toast.error(message);
    }
  }

  if (isSearching) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="border border-neutral-200/80 shadow-sm overflow-hidden p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary relative">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Scouting {businessCategory}s in {location}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Gathering Google Maps metrics, auditing Instagram activity, and building personalized pitches...
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-neutral-600">
              <span>Step {currentStepIndex + 1} of {PROGRESS_STEPS.length}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="text-left space-y-3 pt-2">
            {PROGRESS_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIndex || progressPercent === 100;
              const isCurrent = idx === currentStepIndex && progressPercent < 100;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 text-xs transition-opacity duration-300",
                    isCompleted
                      ? "text-emerald-700 font-medium"
                      : isCurrent
                      ? "text-primary font-semibold"
                      : "text-neutral-400 opacity-60"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-neutral-300 shrink-0" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-neutral-900">New Prospect Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find local businesses with digital gaps, score the opportunity, and generate personalized outreach pitches.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <Card className="border border-neutral-200/80 shadow-sm p-6">
            <form onSubmit={handleStartSearch} className="space-y-6">
              {/* Freelancer Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  Your Freelance Skill
                </label>
                <p className="text-xs text-muted-foreground">
                  Pitches and digital gaps are tailored directly to your specialty.
                </p>
                <select
                  value={freelancerType}
                  onChange={(e) => setFreelancerType(e.target.value as FreelancerType)}
                  className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(FREELANCER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Category */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Target Business Category
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country, City, Specific Place Selection & Live Query Preview */}
              <div className="pt-1">
                <LocationFilter
                  country={country}
                  countryCode={countryCode}
                  city={city}
                  place={place}
                  businessCategory={businessCategory}
                  onCountryChange={(newCountry, newCode) => {
                    setCountry(newCountry);
                    setCountryCode(newCode);
                    const found = ALL_COUNTRIES.find((c) => c.code.toLowerCase() === newCode.toLowerCase());
                    if (found && found.cities.length > 0) {
                      setCity(found.cities[0]);
                    }
                  }}
                  onCityChange={setCity}
                  onPlaceChange={setPlace}
                />
              </div>

              {/* Result Count Slider */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-primary" />
                    Number of Leads to Discover
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {resultCount} leads
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="10"
                    value={resultCount}
                    onChange={(e) => setResultCount(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-neutral-100 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-400 font-medium px-0.5">
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                    <span>50</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!hasEnough || !location.trim()}
                  className="w-full h-11 text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Start Discovery Search — {cost.totalCredits} Credits
                </Button>

                {!hasEnough && (
                  <p className="mt-2 text-xs text-center text-red-600">
                    You have {availableCredits} credits.{" "}
                    <Link href="/credits" className="font-semibold underline">
                      Buy more credits
                    </Link>{" "}
                    to run this search.
                  </p>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* Live Credit Cost Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-neutral-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm text-neutral-900">Live Credit Cost Preview</h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                {resultCount} Leads
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-neutral-600 gap-3">
                <span className="truncate">Google Maps discovery</span>
                <span className="font-medium text-neutral-900 shrink-0 whitespace-nowrap">{cost.mapsCredits} credits</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 gap-3">
                <span className="truncate">Instagram profile scraping</span>
                <span className="font-medium text-neutral-900 shrink-0 whitespace-nowrap">{cost.instagramCredits} credits</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 gap-3">
                <span className="truncate">AI digital gap analysis ({resultCount}x)</span>
                <span className="font-medium text-neutral-900 shrink-0 whitespace-nowrap">{cost.analysisCredits} credits</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 gap-3">
                <span className="truncate">AI personalized pitches ({resultCount}x)</span>
                <span className="font-medium text-neutral-900 shrink-0 whitespace-nowrap">{cost.pitchCredits} credits</span>
              </div>

              <div className="my-3 border-t border-neutral-100" />

              <div className="flex items-center justify-between text-sm font-semibold gap-3">
                <span className="text-neutral-900">Total Credits Required</span>
                <span className="text-primary text-base shrink-0 whitespace-nowrap">{cost.totalCredits} credits</span>
              </div>

              <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-600 gap-3">
                  <span>Your current balance:</span>
                  <span className="font-semibold text-neutral-900 shrink-0 whitespace-nowrap">{availableCredits} credits</span>
                </div>
                <div className="flex justify-between text-xs text-neutral-600 gap-3">
                  <span>Balance after search:</span>
                  <span
                    className={cn(
                      "font-semibold shrink-0 whitespace-nowrap",
                      hasEnough ? "text-emerald-700" : "text-red-600"
                    )}
                  >
                    {hasEnough ? `${availableCredits - cost.totalCredits} credits` : "Insufficient"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 text-xs text-neutral-500 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  Each lead includes phone, website audit, Instagram verification, opportunity score, and ready-to-send pitches.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
