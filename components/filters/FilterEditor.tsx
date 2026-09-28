"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, Check, SlidersHorizontal, MapPin, Instagram, Sparkles, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import type { CustomFilterConfig } from "@/lib/customization/promptBuilder";

interface FilterEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFilter?: CustomFilterConfig | null;
  onSave: (filter: CustomFilterConfig) => void;
}

const DEFAULT_WEIGHTS = {
  noWebsite: 25,
  lowRating: 15,
  fewPhotos: 10,
  unansweredReviews: 18,
  noInstagram: 20,
  deadInstagram: 20,
  lowEngagement: 15,
  noReels: 15,
  budget: 20,
};

export function FilterEditor({
  open,
  onOpenChange,
  initialFilter,
  onSave,
}: FilterEditorProps) {
  // Name & basics
  const [name, setName] = useState(initialFilter?.name || "");
  const [description, setDescription] = useState(initialFilter?.description || "");
  const [isDefault, setIsDefault] = useState(Boolean(initialFilter?.isDefault));

  // Section 1: Google Maps Filters
  const [minRating, setMinRating] = useState<number>(initialFilter?.mapsFilters?.minRating ?? 0);
  const [maxRating, setMaxRating] = useState<number>(initialFilter?.mapsFilters?.maxRating ?? 5);
  const [minReviews, setMinReviews] = useState<number>(initialFilter?.mapsFilters?.minReviews ?? 10);
  const [maxReviews, setMaxReviews] = useState<number | "">(initialFilter?.mapsFilters?.maxReviews ?? "");
  const [websiteOption, setWebsiteOption] = useState<"any" | "none" | "required">(
    initialFilter?.mapsFilters?.requireNoWebsite
      ? "none"
      : initialFilter?.mapsFilters?.requireWebsite
      ? "required"
      : "any"
  );
  const [requirePhone, setRequirePhone] = useState(Boolean(initialFilter?.mapsFilters?.requirePhone));
  const [maxPhotos, setMaxPhotos] = useState<number>(initialFilter?.mapsFilters?.maxPhotos ?? 15);
  const [priceLevels, setPriceLevels] = useState<string[]>(initialFilter?.mapsFilters?.priceLevel || []);
  const [keywordsInName, setKeywordsInName] = useState<string[]>(
    initialFilter?.mapsFilters?.keywordsInName || []
  );
  const [keywordsToExclude, setKeywordsToExclude] = useState<string[]>(
    initialFilter?.mapsFilters?.keywordsToExclude || []
  );
  const [includeTagInput, setIncludeTagInput] = useState("");
  const [excludeTagInput, setExcludeTagInput] = useState("");
  const [requireUnansweredReviews, setRequireUnansweredReviews] = useState(
    Boolean(initialFilter?.mapsFilters?.requireUnansweredReviews)
  );

  // Section 2: Instagram Filters
  const [igPresence, setIgPresence] = useState<"any" | "none" | "has">(
    initialFilter?.instagramFilters?.requireNoInstagram
      ? "none"
      : initialFilter?.instagramFilters?.requireInstagram
      ? "has"
      : "any"
  );
  const [minFollowers, setMinFollowers] = useState<number>(initialFilter?.instagramFilters?.minFollowers ?? 0);
  const [maxFollowers, setMaxFollowers] = useState<number>(initialFilter?.instagramFilters?.maxFollowers ?? 25000);
  const [minDaysSincePost, setMinDaysSincePost] = useState<number>(
    initialFilter?.instagramFilters?.minDaysSincePost ?? 14
  );
  const [maxEngagementRate, setMaxEngagementRate] = useState<number>(
    initialFilter?.instagramFilters?.maxEngagementRate ?? 2.5
  );
  const [requireNoReels, setRequireNoReels] = useState(
    Boolean(initialFilter?.instagramFilters?.requireNoReels)
  );
  const [requireNoLinkInBio, setRequireNoLinkInBio] = useState(
    Boolean(initialFilter?.instagramFilters?.requireNoLinkInBio)
  );
  const [requireInfrequentPosting, setRequireInfrequentPosting] = useState(
    Boolean(initialFilter?.instagramFilters?.requireInfrequentPosting)
  );

  // Section 3: Scoring Weights (0 to 30)
  const [weights, setWeights] = useState({
    ...DEFAULT_WEIGHTS,
    ...(initialFilter?.scoringWeights || {}),
  });

  function togglePrice(lvl: string) {
    if (priceLevels.includes(lvl)) {
      setPriceLevels(priceLevels.filter((p) => p !== lvl));
    } else {
      setPriceLevels([...priceLevels, lvl]);
    }
  }

  function handleAddIncludeTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" && includeTagInput.trim()) {
      e.preventDefault();
      if (!keywordsInName.includes(includeTagInput.trim())) {
        setKeywordsInName([...keywordsInName, includeTagInput.trim()]);
      }
      setIncludeTagInput("");
    }
  }

  function handleAddExcludeTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" && excludeTagInput.trim()) {
      e.preventDefault();
      if (!keywordsToExclude.includes(excludeTagInput.trim())) {
        setKeywordsToExclude([...keywordsToExclude, excludeTagInput.trim()]);
      }
      setExcludeTagInput("");
    }
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Please enter a filter name.");
      return;
    }

    const filterObj: CustomFilterConfig = {
      id: initialFilter?.id || `filter_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      mapsFilters: {
        minRating: minRating > 0 ? minRating : null,
        maxRating: maxRating < 5 ? maxRating : null,
        minReviews: minReviews > 0 ? minReviews : null,
        maxReviews: typeof maxReviews === "number" ? maxReviews : null,
        requireWebsite: websiteOption === "required",
        requireNoWebsite: websiteOption === "none",
        requirePhone: requirePhone || null,
        minPhotos: null,
        maxPhotos: maxPhotos < 20 ? maxPhotos : null,
        priceLevel: priceLevels as ("$" | "$$" | "$$$" | "$$$$")[],
        requireVerified: null,
        requireOpenNow: null,
        keywordsInName,
        keywordsToExclude,
        requireUnansweredReviews: requireUnansweredReviews || null,
        minUnansweredNegative: requireUnansweredReviews ? 1 : null,
      },
      instagramFilters: {
        requireInstagram: igPresence === "has",
        requireNoInstagram: igPresence === "none",
        minFollowers: igPresence === "has" && minFollowers > 0 ? minFollowers : null,
        maxFollowers: igPresence === "has" && maxFollowers < 100000 ? maxFollowers : null,
        minDaysSincePost: igPresence === "has" ? minDaysSincePost : null,
        maxEngagementRate: igPresence === "has" ? maxEngagementRate : null,
        requireNoReels: igPresence === "has" && requireNoReels ? true : null,
        requireNoLinkInBio: igPresence === "has" && requireNoLinkInBio ? true : null,
        requireInfrequentPosting: igPresence === "has" && requireInfrequentPosting ? true : null,
      },
      scoringWeights: weights,
      isActive: true,
      isDefault,
      usageCount: initialFilter?.usageCount || 0,
      createdAt: initialFilter?.createdAt || new Date().toISOString(),
    };

    onSave(filterObj);
    onOpenChange(false);
    toast.success(`Custom filter "${filterObj.name}" saved!`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <DialogHeader className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-neutral-900 dark:text-white">
                {initialFilter ? "Edit Custom Filter" : "Create Custom Scraping Filter"}
              </DialogTitle>
              <p className="text-xs text-neutral-500">
                Filter Google Maps and Instagram profiles to identify high-converting prospect businesses.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* BASICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Filter Name *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dubai No-Website Cafes"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Description (Optional)
              </Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Targets restaurants with no website and dead socials"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50/50">
            <div>
              <span className="font-bold text-neutral-900">Set as Default Filter</span>
              <p className="text-[11px] text-neutral-500">Automatically activates this filter preset during searches.</p>
            </div>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary"
            />
          </div>

          {/* SECTION 1: GOOGLE MAPS FILTERS */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white border-b border-neutral-200/60 pb-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>1. Google Maps Qualification Filters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rating Range */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Rating Range:</span>
                  <span className="font-mono text-primary font-bold">
                    {minRating.toFixed(1)} ★ — {maxRating.toFixed(1)} ★
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={maxRating}
                    onChange={(e) => setMaxRating(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>

              {/* Review Count Min and Max */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Reviews (Min — Max):</span>
                  <span className="font-mono text-primary font-bold">
                    {minReviews}+ {maxReviews ? `to ${maxReviews}` : "(no max)"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={minReviews}
                    onChange={(e) => setMinReviews(parseInt(e.target.value, 10) || 0)}
                    placeholder="Min reviews"
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    min="0"
                    value={maxReviews}
                    onChange={(e) => setMaxReviews(e.target.value ? parseInt(e.target.value, 10) : "")}
                    placeholder="Max reviews (opt)"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Website Filter Radio */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Website Presence
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "any" as const, label: "Any" },
                    { id: "none" as const, label: "Must have NO Website (🔥 Best)" },
                    { id: "required" as const, label: "Must have Website" },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWebsiteOption(opt.id)}
                    className={`p-2 rounded-lg border text-center font-medium transition-all ${
                      websiteOption === opt.id
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 text-neutral-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos & Unanswered Reviews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Max Photos on Maps:</span>
                  <span className="font-mono text-primary font-bold">Under {maxPhotos} photos</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="25"
                  value={maxPhotos}
                  onChange={(e) => setMaxPhotos(parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="unansReviews"
                  checked={requireUnansweredReviews}
                  onChange={(e) => setRequireUnansweredReviews(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary"
                />
                <label htmlFor="unansReviews" className="font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                  Must have unanswered negative reviews
                </label>
              </div>
            </div>

            {/* Price Level & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Price Level Filter
                </Label>
                <div className="flex gap-2">
                  {["$", "$$", "$$$", "$$$$"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => togglePrice(lvl)}
                      className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-xs ${
                        priceLevels.includes(lvl)
                          ? "border-primary bg-primary text-white"
                          : "border-neutral-200 dark:border-neutral-800 text-neutral-600"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="reqPhone"
                  checked={requirePhone}
                  onChange={(e) => setRequirePhone(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary"
                />
                <label htmlFor="reqPhone" className="font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                  Require verified phone number
                </label>
              </div>
            </div>

            {/* Keyword tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Business Name Must Include (Press Enter)
                </Label>
                <Input
                  value={includeTagInput}
                  onChange={(e) => setIncludeTagInput(e.target.value)}
                  onKeyDown={handleAddIncludeTag}
                  placeholder="e.g. bistro, salon, studio"
                  className="h-8 text-xs"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {keywordsInName.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-[10px] flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setKeywordsInName(keywordsInName.filter((k) => k !== tag))}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Exclude Chains & Franchise Words (Press Enter)
                </Label>
                <Input
                  value={excludeTagInput}
                  onChange={(e) => setExcludeTagInput(e.target.value)}
                  onKeyDown={handleAddExcludeTag}
                  placeholder="e.g. mcdonald, starbucks, subway"
                  className="h-8 text-xs"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {keywordsToExclude.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[10px] flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setKeywordsToExclude(keywordsToExclude.filter((k) => k !== tag))}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INSTAGRAM FILTERS */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white border-b border-neutral-200/60 pb-2">
              <Instagram className="w-4 h-4 text-purple-500" />
              <span>2. Instagram Social Audit Filters</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Instagram Presence Condition
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "any" as const, label: "Any Social State" },
                    { id: "none" as const, label: "Has NO Instagram" },
                    { id: "has" as const, label: "Has Instagram (Audit further)" },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIgPresence(opt.id)}
                    className={`p-2 rounded-lg border text-center font-medium transition-all ${
                      igPresence === opt.id
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {igPresence === "has" && (
              <div className="space-y-4 pt-2 border-t border-neutral-200/50 animate-in fade-in-50">
                {/* Followers Range */}
                <div className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>Follower Range:</span>
                    <span className="font-mono text-purple-600 font-bold">
                      {minFollowers.toLocaleString()} — {maxFollowers.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={minFollowers}
                      onChange={(e) => setMinFollowers(parseInt(e.target.value, 10) || 0)}
                      placeholder="Min followers"
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={maxFollowers}
                      onChange={(e) => setMaxFollowers(parseInt(e.target.value, 10) || 50000)}
                      placeholder="Max followers"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Days since last post */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span>Last Posted At Least:</span>
                      <span className="font-mono text-purple-600 font-bold">{minDaysSincePost} days ago</span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="120"
                      value={minDaysSincePost}
                      onChange={(e) => setMinDaysSincePost(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-600"
                    />
                    <div className="flex gap-1.5">
                      {[7, 30, 60, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setMinDaysSincePost(d)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            minDaysSincePost === d
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-white border-neutral-200 text-neutral-600"
                          }`}
                        >
                          {d}d+
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max engagement rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span>Maximum Engagement Rate:</span>
                      <span className="font-mono text-purple-600 font-bold">Under {maxEngagementRate}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.1"
                      value={maxEngagementRate}
                      onChange={(e) => setMaxEngagementRate(parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                    <p className="text-[10px] text-neutral-400">
                      Filters for underperforming accounts with low audience interaction.
                    </p>
                  </div>
                </div>

                {/* Missing features toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireNoReels}
                      onChange={(e) => setRequireNoReels(e.target.checked)}
                      className="rounded border-neutral-300 text-purple-600"
                    />
                    <span className="text-[11px] font-medium">Does NOT use Reels</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireNoLinkInBio}
                      onChange={(e) => setRequireNoLinkInBio(e.target.checked)}
                      className="rounded border-neutral-300 text-purple-600"
                    />
                    <span className="text-[11px] font-medium">NO link in bio</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireInfrequentPosting}
                      onChange={(e) => setRequireInfrequentPosting(e.target.checked)}
                      className="rounded border-neutral-300 text-purple-600"
                    />
                    <span className="text-[11px] font-medium">Posts &lt; 3x per week</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: SCORING WEIGHTS */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
                <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                <span>3. Opportunity Score Weightings (0 — 30)</span>
              </div>
              <button
                type="button"
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {Object.entries(weights).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-lg border border-neutral-200 bg-white space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-mono font-bold text-primary">{v}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={v}
                    onChange={(e) =>
                      setWeights({ ...weights, [k]: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: LIVE PREVIEW */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-950">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Filter Match Summary</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              This filter prioritizes businesses with <strong>rating between {minRating}★ and {maxRating}★</strong>,{" "}
              {websiteOption === "none"
                ? "NO website on Google Maps"
                : websiteOption === "required"
                ? "verified website"
                : "any website state"}
              , {igPresence === "none" ? "no Instagram presence" : igPresence === "has" ? `inactive Instagram (last post ${minDaysSincePost}d+ ago, under ${maxEngagementRate}% engagement)` : "any Instagram status"}, and minimum <strong>{minReviews} reviews</strong>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/60 dark:bg-neutral-900/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="text-xs gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Filter</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
