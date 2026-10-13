"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchFilters } from "@/types";

const FREELANCER_TYPES = [
  { value: "social_media_manager", label: "Social Media Manager" },
  { value: "web_designer", label: "Web Designer" },
  { value: "graphic_designer", label: "Graphic Designer" },
  { value: "video_editor", label: "Video Editor" },
  { value: "copywriter", label: "Copywriter" },
  { value: "photographer", label: "Photographer" },
  { value: "seo_specialist", label: "SEO Specialist" },
];

const BUSINESS_TYPES = [
  "Restaurants",
  "Cafes",
  "Salons",
  "Spas",
  "Gyms",
  "Retail shops",
  "Hotels",
  "Bakeries",
  "Dental clinics",
  "Real estate agencies",
  "Law firms",
];

const COUNTRIES = [
  { code: "AE", name: "UAE", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { code: "IN", name: "India", cities: ["Mumbai", "Delhi", "Bangalore", "Chennai"] },
  { code: "GB", name: "UK", cities: ["London", "Manchester", "Birmingham"] },
  { code: "US", name: "USA", cities: ["New York", "Los Angeles", "Chicago", "Houston"] },
  { code: "SA", name: "Saudi Arabia", cities: ["Riyadh", "Jeddah", "Dammam"] },
  { code: "PK", name: "Pakistan", cities: ["Karachi", "Lahore", "Islamabad"] },
  { code: "AU", name: "Australia", cities: ["Sydney", "Melbourne", "Brisbane"] },
  { code: "CA", name: "Canada", cities: ["Toronto", "Vancouver", "Montreal"] },
  { code: "QA", name: "Qatar", cities: ["Doha"] },
  { code: "SG", name: "Singapore", cities: ["Singapore"] },
];

export function SearchForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [freelancerType, setFreelancerType] = useState("social_media_manager");
  const [businessType, setBusinessType] = useState("Restaurants");
  const [country, setCountry] = useState("AE");
  const [city, setCity] = useState("Dubai");
  const [specificPlace, setSpecificPlace] = useState("");
  const [resultCount, setResultCount] = useState(20);

  // Filter state
  const [noWebsite, setNoWebsite] = useState(false);
  const [maxRating, setMaxRating] = useState<number | null>(null);
  const [minReviews, setMinReviews] = useState(5);
  const [noInstagram, setNoInstagram] = useState(false);
  const [deadInstagram, setDeadInstagram] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  // Calculate credit cost
  const creditCost =
    Math.ceil(resultCount / 10) * 2 +
    Math.ceil(resultCount / 10) * 3 +
    resultCount * 2;

  // Build filters object
  function buildFilters(): SearchFilters {
    return {
      requireNoWebsite: noWebsite ? true : null,
      requireWebsite: null,
      minRating: null,
      maxRating: maxRating,
      minReviews: minReviews,
      maxReviews: null,
      maxPhotos: null,
      priceLevel: [],
      keywordsInName: [],
      keywordsToExclude: [],
      requireVerified: null,
      requireUnansweredReviews: null,
      instagram:
        noInstagram || deadInstagram
          ? {
              requireNoInstagram: noInstagram ? true : null,
              requireInstagram: null,
              minFollowers: null,
              maxFollowers: null,
              minDaysSincePost: deadInstagram ? 30 : null,
              maxEngagementRate: null,
              requireNoReels: null,
              requireNoLinkInBio: null,
            }
          : null,
    };
  }

  // Count active filters for badge
  const activeFilterCount = [
    noWebsite,
    maxRating !== null,
    minReviews > 5,
    noInstagram,
    deadInstagram,
  ].filter(Boolean).length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!city) {
      setError("Please enter a city");
      return;
    }

    const filters = buildFilters();

    // Log what we are sending
    console.log("Submitting search with filters:", filters);

    setLoading(true);

    try {
      const response = await fetch("/api/search/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freelancerType,
          freelancerSkills: [],
          businessCategory: businessType,
          businessType,
          location: `${specificPlace || city}, ${city}`,
          country: selectedCountry?.name || country,
          city,
          specificPlace: specificPlace || city,
          resultCount,
          filters, // ← FILTERS INCLUDED
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "insufficient_credits") {
          setError(
            `You need ${data.required} credits but only have ${data.available}. Buy more credits to search.`
          );
          return;
        }
        setError(data.message || data.error || "Search failed");
        return;
      }

      router.push("/leads");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">New search</h1>
        <p className="text-gray-500 mt-1">
          Find businesses that need your services
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* FREELANCER TYPE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            I am a
          </label>
          <select
            value={freelancerType}
            onChange={(e) => setFreelancerType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FREELANCER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* BUSINESS TYPE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Looking for
          </label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* LOCATION */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                const c = COUNTRIES.find((x) => x.code === e.target.value);
                if (c) setCity(c.cities[0]);
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selectedCountry?.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SPECIFIC AREA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Area or neighbourhood
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={specificPlace}
            onChange={(e) => setSpecificPlace(e.target.value)}
            placeholder={`e.g. Jumeirah, Downtown ${city}`}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* RESULT COUNT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Number of results: {resultCount}
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={resultCount}
            onChange={(e) => setResultCount(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5</span>
            <span>50</span>
          </div>
        </div>

        {/* FILTERS SECTION */}
        <div className="border border-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="w-full flex items-center justify-between p-4 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2">
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilterCount} active
                </span>
              )}
            </span>
            <span className="text-gray-400">{showFilters ? "▲" : "▼"}</span>
          </button>

          {showFilters && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
              {/* NO WEBSITE FILTER */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    No website only
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Only show businesses without a website
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoWebsite((prev) => !prev)}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    shrink-0
                    ${noWebsite ? "bg-blue-600" : "bg-gray-200"}
                  `}
                >
                  <span
                    className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full
                    shadow transition-transform
                    ${noWebsite ? "translate-x-6" : "translate-x-1"}
                  `}
                  />
                </button>
              </div>

              {noWebsite && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  ✓ Will only return businesses with no website
                </p>
              )}

              {/* NO INSTAGRAM FILTER */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    No Instagram only
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Only show businesses without Instagram
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNoInstagram((prev) => !prev)}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    shrink-0
                    ${noInstagram ? "bg-blue-600" : "bg-gray-200"}
                  `}
                >
                  <span
                    className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full
                    shadow transition-transform
                    ${noInstagram ? "translate-x-6" : "translate-x-1"}
                  `}
                  />
                </button>
              </div>

              {/* DEAD INSTAGRAM FILTER */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Dead Instagram (30+ days no post)
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Only businesses with inactive accounts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeadInstagram((prev) => !prev)}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    shrink-0
                    ${deadInstagram ? "bg-blue-600" : "bg-gray-200"}
                  `}
                >
                  <span
                    className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full
                    shadow transition-transform
                    ${deadInstagram ? "translate-x-6" : "translate-x-1"}
                  `}
                  />
                </button>
              </div>

              {/* MAX RATING */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Max rating (target struggling businesses)
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[null, 3.0, 3.5, 4.0, 4.5].map((r) => (
                    <button
                      key={String(r)}
                      type="button"
                      onClick={() => setMaxRating(r)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs border
                        transition-all
                        ${
                          maxRating === r
                            ? "bg-blue-600 text-white border-blue-600"
                            : "text-gray-500 border-gray-200 hover:border-blue-300"
                        }
                      `}
                    >
                      {r === null ? "Any rating" : `Below ${r}★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* MIN REVIEWS */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Minimum reviews (established businesses)
                </p>
                <div className="flex gap-2 flex-wrap">
                  {[3, 10, 20, 50, 100].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setMinReviews(r)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs border
                        transition-all
                        ${
                          minReviews === r
                            ? "bg-blue-600 text-white border-blue-600"
                            : "text-gray-500 border-gray-200"
                        }
                      `}
                    >
                      {r}+ reviews
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIVE FILTER SUMMARY */}
              {activeFilterCount > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                  <p className="font-medium">Active filters:</p>
                  {noWebsite && <p>• Only businesses with no website</p>}
                  {noInstagram && <p>• Only businesses with no Instagram</p>}
                  {deadInstagram && (
                    <p>
                      • Only businesses inactive on Instagram (30+ days)
                    </p>
                  )}
                  {maxRating && <p>• Rating below {maxRating}★</p>}
                  {minReviews > 3 && <p>• Minimum {minReviews} reviews</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CREDIT COST BOX */}
        <div
          className={`
          rounded-xl p-4 border
          ${
            creditCost > 0
              ? "bg-blue-50 border-blue-200"
              : "bg-gray-50 border-gray-200"
          }
        `}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                This search costs
              </p>
              <p className="text-xs text-blue-500 mt-0.5">
                Top-up credits never expire
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-700">{creditCost}</p>
              <p className="text-xs text-blue-500">credits</p>
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting search...
            </>
          ) : (
            `Find clients — ${creditCost} credits`
          )}
        </button>
      </form>
    </div>
  );
}
