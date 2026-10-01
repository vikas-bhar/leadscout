"use client";

import { useState, useEffect } from "react";
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
  PlusCircle,
  Bot,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  BUSINESS_CATEGORIES,
  FREELANCER_TYPE_LABELS,
  type FreelancerType,
  type CustomClientFilter,
} from "@/types";
import { calculateSearchCost } from "@/lib/credit-calc";
import { saveLocalLeads, saveLocalSearch, deductLocalCredits, getLocalBalance, safeJsonStringify } from "@/lib/local-store";
import {
  LocationFilter,
  buildSearchLocationString,
  ALL_COUNTRIES,
} from "@/components/search/LocationFilter";
import { CustomClientFilterAgent } from "@/components/search/CustomClientFilterAgent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/UpgradeGate";
import type { CustomPromptConfig, CustomFilterConfig } from "@/lib/customization/promptBuilder";
import {
  getLocalPrompts,
  getLocalFilters,
  saveLocalTemplate,
} from "@/lib/local-store";

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

  // Search Mode: "custom_agent" vs "standard"
  const [searchMode, setSearchMode] = useState<"custom_agent" | "standard">("custom_agent");

  const [freelancerType, setFreelancerType] = useState<FreelancerType>(initialFreelancerType);
  const [businessCategory, setBusinessCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  
  // Country & City selection state
  const [country, setCountry] = useState<string>("USA");
  const [countryCode, setCountryCode] = useState<string>("US");
  const [city, setCity] = useState<string>("New York");
  const [place, setPlace] = useState<string>("Manhattan");

  const location = buildSearchLocationString(place, city, country);

  const [resultCount, setResultCount] = useState<number>(10);
  const [availableCredits, setAvailableCredits] = useState<number>(initialAvailableCredits);
  const [isRefilling, setIsRefilling] = useState(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [activeCustomFilter, setActiveCustomFilter] = useState<CustomClientFilter | null>(null);

  // Custom Prompt & Custom Filter States
  const [promptsList, setPromptsList] = useState<CustomPromptConfig[]>([]);
  const [filtersList, setFiltersList] = useState<CustomFilterConfig[]>([]);
  const [promptSelectionMode, setPromptSelectionMode] = useState<"default" | "custom">("default");
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [useCustomFilter, setUseCustomFilter] = useState<boolean>(false);
  const [selectedFilterId, setSelectedFilterId] = useState<string>("filter_no_website");
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>("");

  useEffect(() => {
    setPromptsList(getLocalPrompts());
    setFiltersList(getLocalFilters());

    async function loadRemotePromptsAndFilters() {
      try {
        const [resP, resF] = await Promise.all([fetch("/api/prompts"), fetch("/api/filters")]);
        if (resP.ok) {
          const dataP = await resP.json();
          if (dataP.prompts && dataP.prompts.length > 0) setPromptsList(dataP.prompts);
        }
        if (resF.ok) {
          const dataF = await resF.json();
          if (dataF.filters && dataF.filters.length > 0) setFiltersList(dataF.filters);
        }
      } catch {
        // Fallback to local store already set
      }
    }
    void loadRemotePromptsAndFilters();
  }, []);

  // Sync live credits from server and local storage
  useEffect(() => {
    let cancelled = false;

    async function fetchServerCredits() {
      try {
        const res = await fetch("/api/credits/balance");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.availableCredits === "number") {
          setAvailableCredits(data.availableCredits);
        }
      } catch {
        const local = getLocalBalance();
        if (local && typeof local.availableCredits === "number" && !cancelled) {
          setAvailableCredits(local.availableCredits);
        }
      }
    }

    void fetchServerCredits();

    function sync() {
      const local = getLocalBalance();
      if (local && typeof local.availableCredits === "number" && !cancelled) {
        setAvailableCredits(local.availableCredits);
      }
    }

    window.addEventListener("freelancefind_store_updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener("freelancefind_store_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const cost = calculateSearchCost(resultCount);
  const hasEnough = availableCredits >= cost.totalCredits;

  async function handleClaimRefill() {
    setIsRefilling(true);
    try {
      const res = await fetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 50 }),
      });
      const data = await res.json();
      if (res.ok && typeof data.newBalance === "number") {
        setAvailableCredits(data.newBalance);
        setError(null);
        toast.success(`Claimed 50 test credits! New balance: ${data.newBalance} credits.`);
        window.dispatchEvent(new Event("freelancefind_store_updated"));
      } else {
        toast.error(data.error || "Could not refill test credits");
      }
    } catch {
      toast.error("Network error while claiming test credits");
    } finally {
      setIsRefilling(false);
    }
  }

  async function handleExecuteSearch(customFilterArg?: unknown) {
    // Prevent synthetic events or DOM elements from being treated as CustomClientFilter
    const isFilterObject =
      customFilterArg &&
      typeof customFilterArg === "object" &&
      !("nativeEvent" in (customFilterArg as Record<string, unknown>)) &&
      !("target" in (customFilterArg as Record<string, unknown>)) &&
      !("preventDefault" in (customFilterArg as Record<string, unknown>)) &&
      "nicheFocus" in (customFilterArg as Record<string, unknown>);

    const customFilter = isFilterObject ? (customFilterArg as CustomClientFilter) : undefined;

    const searchTargetLocation = (customFilter?.targetLocation?.rawLocation || location).trim();
    const searchCategory = customFilter?.primaryCategory || businessCategory;
    const searchFreelancerType = customFilter?.freelancerType || freelancerType;
    const searchCountry = customFilter?.targetLocation?.country || country;
    const searchCountryCode = customFilter?.targetLocation?.countryCode || countryCode;
    const searchCity = customFilter?.targetLocation?.city || city;
    const searchPlace = customFilter?.targetLocation?.place || place;

    if (!searchTargetLocation) {
      toast.error("Please select or describe a target location");
      return;
    }

    if (!hasEnough) {
      toast.error(
        `Insufficient credits. You need ${cost.totalCredits} credits, but have ${availableCredits}.`
      );
      setError(`Insufficient credits. This search requires ${cost.totalCredits} credits, but you have ${availableCredits} available.`);
      return;
    }

    setError(null);
    setActiveCustomFilter(customFilter || null);
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
      const activePromptConfig =
        promptSelectionMode === "custom" && selectedPromptId
          ? promptsList.find((p) => p.id === selectedPromptId)
          : undefined;

      const activeFilterConfig =
        useCustomFilter && selectedFilterId
          ? filtersList.find((f) => f.id === selectedFilterId)
          : undefined;

      if (saveAsTemplate && templateName.trim()) {
        saveLocalTemplate({
          id: `template_${Date.now()}`,
          name: templateName.trim(),
          config: {
            location: searchTargetLocation,
            businessCategory: searchCategory,
            freelancerType: searchFreelancerType,
            resultCount,
            country: searchCountry,
            city: searchCity,
            place: searchPlace,
          },
          customPromptId: activePromptConfig?.id,
          customFilterId: activeFilterConfig?.id,
          createdAt: new Date().toISOString(),
        });
      }

      const response = await fetch("/api/search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeJsonStringify({
          location: searchTargetLocation,
          businessCategory: searchCategory,
          freelancerType: searchFreelancerType,
          resultCount,
          country: searchCountry,
          countryCode: searchCountryCode,
          city: searchCity,
          place: searchPlace,
          customFilter: customFilter || undefined,
          customPromptConfig: activePromptConfig || undefined,
          customFilterConfig: activeFilterConfig || undefined,
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
        `Search for ${customFilter?.nicheFocus || searchCategory} in ${searchTargetLocation} (${resultCount} results)`,
        data.searchId
      );

      // Finish progress animation
      setProgressPercent(100);
      setCurrentStepIndex(PROGRESS_STEPS.length - 1);
      toast.success(`Discovered ${data.resultsCount || resultCount} qualified leads matching criteria!`);

      if (typeof data.newBalance === "number") {
        setAvailableCredits(data.newBalance);
        window.dispatchEvent(new Event("freelancefind_store_updated"));
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

  async function handleStartStandardSearch(e: React.FormEvent) {
    e.preventDefault();
    await handleExecuteSearch();
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
              Scouting {activeCustomFilter?.nicheFocus || businessCategory}s in {activeCustomFilter?.targetLocation?.rawLocation || location}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {activeCustomFilter
                ? `Agent filter active: Prioritizing ${activeCustomFilter.digitalGapPriorities.slice(0, 2).join(" & ")}...`
                : "Gathering Google Maps metrics, auditing Instagram activity, and building personalized pitches..."}
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-neutral-900">Prospect Search</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find local businesses with digital gaps, score the opportunity, and generate personalized outreach pitches.
          </p>
        </div>

        {/* Search Mode Toggle Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl border border-neutral-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSearchMode("custom_agent")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              searchMode === "custom_agent"
                ? "bg-white text-primary shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
            )}
          >
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span>AI Custom Filter Agent</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 bg-primary/10 text-primary rounded-full font-bold">
              New
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchMode("standard")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              searchMode === "standard"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-white/50"
            )}
          >
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <span>Standard Filters</span>
          </button>
        </div>
      </div>

      {searchMode === "custom_agent" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <CustomClientFilterAgent
              currentFreelancerType={freelancerType}
              currentCountry={country}
              currentCity={city}
              currentPlace={place}
              resultCount={resultCount}
              onResultCountChange={setResultCount}
              onContinueToSearch={handleExecuteSearch}
              disabled={isSearching}
            />
          </div>

          {/* Right Cost & Balance Card */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-neutral-200/80 shadow-sm p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-500" />
                  Your Wallet
                </span>
                <span className="text-sm font-bold text-neutral-900">
                  {availableCredits} credits
                </span>
              </div>

              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Target Results:</span>
                  <span className="font-semibold text-neutral-900">{resultCount} leads</span>
                </div>
                <div className="flex justify-between">
                  <span>Search Cost:</span>
                  <span className="font-semibold text-primary">{cost.totalCredits} credits</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-100 font-semibold text-neutral-900">
                  <span>Remaining after search:</span>
                  <span className={availableCredits - cost.totalCredits < 0 ? "text-red-600" : "text-emerald-600"}>
                    {availableCredits - cost.totalCredits} credits
                  </span>
                </div>
              </div>

              {availableCredits < cost.totalCredits && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClaimRefill}
                    disabled={isRefilling}
                    className="w-full text-xs h-9 border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100/60 font-medium gap-1.5"
                  >
                    {isRefilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5 text-amber-600" />}
                    Claim 50 Free Test Credits
                  </Button>
                </div>
              )}
            </Card>

            <Card className="border border-neutral-200/80 shadow-sm p-5 space-y-3 bg-neutral-50/70">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                How Custom Agent Filter Works
              </span>
              <ol className="space-y-2 text-xs text-neutral-600 list-decimal list-inside leading-relaxed">
                <li><strong className="text-neutral-800">Describe:</strong> Enter your exact target client persona, desired digital gaps, and budget goals.</li>
                <li><strong className="text-neutral-800">Understand:</strong> AI Agent breaks down your brief into structured scouting parameters & pitch angles.</li>
                <li><strong className="text-neutral-800">Scout & Filter:</strong> The pipeline searches and ranks leads matching your exact custom criteria.</li>
              </ol>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-7">
            <Card className="border border-neutral-200/80 shadow-sm p-6">
              <form onSubmit={handleStartStandardSearch} className="space-y-6">
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
                    setPlace(""); // Automatically clear specific place when changing country
                    const found = ALL_COUNTRIES.find((c) => c.code.toLowerCase() === newCode.toLowerCase());
                    if (found && found.cities.length > 0) {
                      setCity(found.cities[0]);
                    } else {
                      setCity("");
                    }
                  }}
                  onCityChange={(newCity) => {
                    setCity(newCity);
                    setPlace(""); // Automatically clear specific place when changing city
                  }}
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

              {/* Custom AI Prompt Section */}
              <div className="space-y-2.5 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    AI Analysis Style & Psychology
                  </label>
                  <Link href="/prompts" className="text-[11px] text-primary hover:underline font-medium">
                    Manage Prompts →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPromptSelectionMode("default")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all",
                      promptSelectionMode === "default"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    )}
                  >
                    <div>Standard Master AI</div>
                    <div className="text-[10px] text-neutral-400 font-normal">Optimal gap detection</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPromptSelectionMode("custom")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all",
                      promptSelectionMode === "custom"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-600"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span>Custom Prompt</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                        Growth
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-normal">Your tailored rules</div>
                  </button>
                </div>

                {promptSelectionMode === "custom" && (
                  <UpgradeGate feature="Custom AI Prompts" requiredPlan="growth" featureKey="customPrompts">
                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2">
                      <Label className="text-xs font-medium text-neutral-700">Select Custom Prompt</Label>
                      <select
                        value={selectedPromptId}
                        onChange={(e) => setSelectedPromptId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900"
                      >
                        <option value="">-- Choose saved prompt --</option>
                        {promptsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.isDefault ? "(Default)" : ""}
                          </option>
                        ))}
                      </select>
                      <div className="flex justify-between items-center text-[11px] text-neutral-500 pt-1">
                        <span>Configures system role, gap priorities & pitch angle.</span>
                        <Link href="/prompts" className="text-primary font-semibold hover:underline">
                          + Create new prompt
                        </Link>
                      </div>
                    </div>
                  </UpgradeGate>
                )}
              </div>

              {/* Custom Filter Section */}
              <div className="space-y-2.5 pt-3 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                    Business Qualification Filter
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-neutral-600">
                    <input
                      type="checkbox"
                      checked={useCustomFilter}
                      onChange={(e) => setUseCustomFilter(e.target.checked)}
                      className="rounded border-neutral-300 text-primary"
                    />
                    <span>Custom Filter</span>
                  </label>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all_gaps", label: "All Gaps (Standard)" },
                    { id: "filter_no_website", label: "No Website" },
                    { id: "filter_dead_instagram", label: "Dead Instagram" },
                    { id: "filter_poor_reviews", label: "Poor Reviews" },
                    { id: "filter_premium_businesses", label: "Premium ($$$+)" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setUseCustomFilter(preset.id !== "all_gaps");
                        setSelectedFilterId(preset.id);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                        selectedFilterId === preset.id
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {useCustomFilter && (
                  <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-neutral-700">Saved Filter Rule</Label>
                      <Link href="/prompts" className="text-[11px] text-primary font-semibold hover:underline">
                        + Edit or Create Filter
                      </Link>
                    </div>
                    <select
                      value={selectedFilterId}
                      onChange={(e) => setSelectedFilterId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-900"
                    >
                      {filtersList.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-500">
                      Filters candidates by review count, website status, social freshness, and engagement.
                    </p>
                  </div>
                )}
              </div>

              {/* Save As Search Template Toggle */}
              <div className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="rounded border-neutral-300 text-primary"
                  />
                  <span>Save this search setup as a reusable template</span>
                </label>
                {saveAsTemplate && (
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Dubai High-Ticket Hospitality Search"
                    className="h-8 text-xs bg-white"
                  />
                )}
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {availableCredits < cost.totalCredits && (
                    <div className="pt-1 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleClaimRefill}
                        disabled={isRefilling}
                        className="h-8 text-xs bg-white border-red-300 text-red-700 hover:bg-red-50 font-medium gap-1.5"
                      >
                        {isRefilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                        Claim 50 Free Test Credits
                      </Button>
                      <Link href="/credits" className="text-xs text-primary font-medium underline">
                        View Packages
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  disabled={!hasEnough || !location.trim()}
                  className="w-full h-11 text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Start Discovery Search — {cost.totalCredits} Credits
                </Button>

                {!hasEnough && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <p className="font-semibold">Insufficient credits for this search</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Current balance: <strong>{availableCredits} credits</strong> (Search requires <strong>{cost.totalCredits} credits</strong>).
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleClaimRefill}
                      disabled={isRefilling}
                      className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium shrink-0 gap-1.5"
                    >
                      {isRefilling ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                      Claim +50 Free Credits
                    </Button>
                  </div>
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

              <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 mt-4 space-y-2">
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

                {!hasEnough && (
                  <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">Need more testing credits?</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClaimRefill}
                      disabled={isRefilling}
                      className="h-6 text-[11px] text-primary hover:text-primary hover:bg-primary/10 px-2 font-semibold"
                    >
                      {isRefilling ? "Adding..." : "+50 Test Credits"}
                    </Button>
                  </div>
                )}
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
    )}
  </div>
);
}
