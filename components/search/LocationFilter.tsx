"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  MapPin,
  Globe2,
  Building2,
  Search,
  ChevronDown,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountryItem {
  code: string;
  name: string;
  flag: string;
  cities: string[];
}

export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  try {
    return code
      .toUpperCase()
      .split("")
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join("");
  } catch {
    return "🌐";
  }
}

export const POPULAR_COUNTRIES: CountryItem[] = [
  { code: "AE", name: "UAE", flag: "🇦🇪", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"] },
  { code: "IN", name: "India", flag: "🇮🇳", cities: ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"] },
  { code: "US", name: "USA", flag: "🇺🇸", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "San Francisco"] },
  { code: "GB", name: "UK", flag: "🇬🇧", cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Edinburgh"] },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", cities: ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"] },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", cities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi"] },
  { code: "AU", name: "Australia", flag: "🇦🇺", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
  { code: "CA", name: "Canada", flag: "🇨🇦", cities: ["Toronto", "Vancouver", "Montreal", "Calgary"] },
  { code: "SG", name: "Singapore", flag: "🇸🇬", cities: ["Singapore"] },
  { code: "QA", name: "Qatar", flag: "🇶🇦", cities: ["Doha", "Al Wakrah", "Al Khor"] },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", cities: ["Kuwait City", "Hawalli", "Salmiya"] },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", cities: ["Manama", "Riffa", "Muharraq"] },
];

export const OTHER_COUNTRIES: CountryItem[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷", cities: ["Buenos Aires", "Cordoba", "Rosario", "Mendoza"] },
  { code: "AT", name: "Austria", flag: "🇦🇹", cities: ["Vienna", "Salzburg", "Innsbruck", "Graz"] },
  { code: "BE", name: "Belgium", flag: "🇧🇪", cities: ["Brussels", "Antwerp", "Ghent", "Bruges"] },
  { code: "BR", name: "Brazil", flag: "🇧🇷", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Curitiba"] },
  { code: "CL", name: "Chile", flag: "🇨🇱", cities: ["Santiago", "Valparaiso", "Concepcion"] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", cities: ["Bogota", "Medellin", "Cali", "Barranquilla"] },
  { code: "DK", name: "Denmark", flag: "🇩🇰", cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg"] },
  { code: "EG", name: "Egypt", flag: "🇪🇬", cities: ["Cairo", "Alexandria", "Giza", "Sharm El Sheikh"] },
  { code: "FI", name: "Finland", flag: "🇫🇮", cities: ["Helsinki", "Espoo", "Tampere", "Turku"] },
  { code: "FR", name: "France", flag: "🇫🇷", cities: ["Paris", "Lyon", "Marseille", "Nice", "Bordeaux"] },
  { code: "DE", name: "Germany", flag: "🇩🇪", cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"] },
  { code: "GR", name: "Greece", flag: "🇬🇷", cities: ["Athens", "Thessaloniki", "Heraklion", "Rhodes"] },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", cities: ["Hong Kong", "Kowloon", "Central"] },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", cities: ["Jakarta", "Bali", "Surabaya", "Bandung"] },
  { code: "IE", name: "Ireland", flag: "🇮🇪", cities: ["Dublin", "Cork", "Galway", "Limerick"] },
  { code: "IL", name: "Israel", flag: "🇮🇱", cities: ["Tel Aviv", "Jerusalem", "Haifa", "Herzliya"] },
  { code: "IT", name: "Italy", flag: "🇮🇹", cities: ["Rome", "Milan", "Naples", "Florence", "Turin"] },
  { code: "JP", name: "Japan", flag: "🇯🇵", cities: ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"] },
  { code: "JO", name: "Jordan", flag: "🇯🇴", cities: ["Amman", "Aqaba", "Zarqa"] },
  { code: "KE", name: "Kenya", flag: "🇰🇪", cities: ["Nairobi", "Mombasa", "Kisumu"] },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", cities: ["Kuala Lumpur", "Penang", "Johor Bahru"] },
  { code: "MX", name: "Mexico", flag: "🇲🇽", cities: ["Mexico City", "Guadalajara", "Monterrey", "Cancun"] },
  { code: "MA", name: "Morocco", flag: "🇲🇦", cities: ["Casablanca", "Marrakech", "Rabat", "Tangier"] },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"] },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", cities: ["Auckland", "Wellington", "Christchurch"] },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", cities: ["Lagos", "Abuja", "Port Harcourt", "Ibadan"] },
  { code: "NO", name: "Norway", flag: "🇳🇴", cities: ["Oslo", "Bergen", "Trondheim", "Stavanger"] },
  { code: "OM", name: "Oman", flag: "🇴🇲", cities: ["Muscat", "Salalah", "Sohar"] },
  { code: "PH", name: "Philippines", flag: "🇵🇭", cities: ["Manila", "Cebu City", "Davao City", "Makati"] },
  { code: "PL", name: "Poland", flag: "🇵🇱", cities: ["Warsaw", "Krakow", "Wroclaw", "Gdansk"] },
  { code: "PT", name: "Portugal", flag: "🇵🇹", cities: ["Lisbon", "Porto", "Faro", "Braga"] },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", cities: ["Johannesburg", "Cape Town", "Durban", "Pretoria"] },
  { code: "KR", name: "South Korea", flag: "🇰🇷", cities: ["Seoul", "Busan", "Incheon", "Daegu"] },
  { code: "ES", name: "Spain", flag: "🇪🇸", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga"] },
  { code: "SE", name: "Sweden", flag: "🇸🇪", cities: ["Stockholm", "Gothenburg", "Malmo", "Uppsala"] },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", cities: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"] },
  { code: "TH", name: "Thailand", flag: "🇹🇭", cities: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya"] },
  { code: "TR", name: "Turkey", flag: "🇹🇷", cities: ["Istanbul", "Ankara", "Izmir", "Antalya"] },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", cities: ["Ho Chi Minh City", "Hanoi", "Da Nang"] },
];

export const ALL_COUNTRIES: CountryItem[] = [...POPULAR_COUNTRIES, ...OTHER_COUNTRIES];

export interface LocationFilterProps {
  country: string;
  countryCode: string;
  city: string;
  place: string;
  businessCategory: string;
  onCountryChange: (countryName: string, countryCode: string) => void;
  onCityChange: (city: string) => void;
  onPlaceChange: (place: string) => void;
  onLocationCombinedChange?: (combined: string) => void;
  className?: string;
}

export function buildSearchLocationString(place: string, city: string, country: string): string {
  const parts = [place.trim(), city.trim(), country.trim()].filter(Boolean);
  return parts.join(", ");
}

export function buildFullSearchQuery(businessCategory: string, place: string, city: string, country: string): string {
  const loc = buildSearchLocationString(place, city, country);
  const cat = businessCategory.trim() || "businesses";
  if (!loc) return `${cat}`;
  return `${cat} in ${loc}`;
}

export function LocationFilter({
  country,
  countryCode,
  city,
  place,
  businessCategory,
  onCountryChange,
  onCityChange,
  onPlaceChange,
  onLocationCombinedChange,
  className,
}: LocationFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setCountrySearchQuery("");
    }
  }, [isDropdownOpen]);

  // Notify parent of combined location string changes
  useEffect(() => {
    const combined = buildSearchLocationString(place, city, country);
    onLocationCombinedChange?.(combined);
  }, [place, city, country, onLocationCombinedChange]);

  // Current country item
  const selectedCountryItem = useMemo(() => {
    return ALL_COUNTRIES.find(
      (c) => c.code.toLowerCase() === countryCode.toLowerCase() || c.name.toLowerCase() === country.toLowerCase()
    );
  }, [country, countryCode]);

  // Filtered countries for the dropdown
  const filteredPopular = useMemo(() => {
    if (!countrySearchQuery.trim()) return POPULAR_COUNTRIES;
    const q = countrySearchQuery.toLowerCase();
    return POPULAR_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearchQuery]);

  const filteredOther = useMemo(() => {
    if (!countrySearchQuery.trim()) return OTHER_COUNTRIES;
    const q = countrySearchQuery.toLowerCase();
    return OTHER_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countrySearchQuery]);

  // Available city suggestions for the current country
  const availableCities = selectedCountryItem?.cities || [];

  function handleSelectCountry(item: CountryItem) {
    onCountryChange(item.name, item.code);
    setIsDropdownOpen(false);
    // Clear specific neighborhood from previous country to avoid invalid search queries
    onPlaceChange("");
  }

  function handleCityPillClick(cityName: string) {
    if (city.toLowerCase() === cityName.toLowerCase()) {
      onCityChange("");
    } else {
      onCityChange(cityName);
    }
    // Clear specific neighborhood from previous city
    onPlaceChange("");
  }

  const liveSearchPreview = buildFullSearchQuery(businessCategory, place, city, country);
  const hasAnyLocation = Boolean(country.trim() || city.trim() || place.trim());

  return (
    <div className={cn("space-y-4", className)}>
      {/* 3 Fields in a row on Desktop, stacked on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Field 1: Country Dropdown */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            Country
          </label>

          <div className="relative">
            <button
              type="button"
              id="country-select-button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={cn(
                "w-full h-10 px-3 rounded-lg border bg-white text-sm text-left flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                isDropdownOpen ? "border-primary ring-2 ring-primary/20" : "border-neutral-200 hover:border-neutral-300"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                {selectedCountryItem ? (
                  <>
                    <span className="text-base leading-none">{selectedCountryItem.flag}</span>
                    <span className="font-medium text-neutral-900 truncate">{selectedCountryItem.name}</span>
                    <span className="text-[11px] text-neutral-400 font-mono">({selectedCountryItem.code})</span>
                  </>
                ) : country ? (
                  <>
                    <span className="text-base leading-none">{getCountryFlag(countryCode)}</span>
                    <span className="font-medium text-neutral-900 truncate">{country}</span>
                  </>
                ) : (
                  <span className="text-neutral-400">Select country...</span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-neutral-400 transition-transform duration-200 shrink-0",
                  isDropdownOpen && "rotate-180 text-primary"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 mt-1.5 w-full min-w-[280px] max-w-sm rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                {/* Search input */}
                <div className="p-2 border-b border-neutral-100 bg-neutral-50/50">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs bg-white rounded-md border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary text-neutral-900 placeholder:text-neutral-400"
                    />
                    {countrySearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCountrySearchQuery("")}
                        className="absolute right-2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Country Lists */}
                <div className="max-h-60 overflow-y-auto p-1 divide-y divide-neutral-100 text-xs">
                  {/* Popular Countries Section */}
                  {filteredPopular.length > 0 && (
                    <div className="pb-1">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Popular Countries
                      </div>
                      {filteredPopular.map((c) => {
                        const isSelected = selectedCountryItem?.code === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleSelectCountry(c)}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-neutral-100 text-neutral-800"
                            )}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="text-base">{c.flag}</span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* All Other Countries Section */}
                  {filteredOther.length > 0 && (
                    <div className="pt-1">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        All Countries
                      </div>
                      {filteredOther.map((c) => {
                        const isSelected = selectedCountryItem?.code === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleSelectCountry(c)}
                            className={cn(
                              "w-full px-2.5 py-1.5 rounded-md flex items-center justify-between text-left transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-neutral-100 text-neutral-800"
                            )}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="text-base">{c.flag}</span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filteredPopular.length === 0 && filteredOther.length === 0 && (
                    <div className="p-4 text-center text-neutral-400">
                      No country found matching &ldquo;{countrySearchQuery}&rdquo;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Field 2: City / Region field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            City / Region
          </label>
          <div className="relative">
            <input
              type="text"
              id="city-input"
              placeholder={selectedCountryItem ? `e.g. ${selectedCountryItem.cities[0] || "City"}` : "e.g. Dubai, New York"}
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {city && (
              <button
                type="button"
                onClick={() => onCityChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Field 3: Specific Place (NEW) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Specific Place / Area
            <span className="text-[10px] lowercase font-normal text-neutral-400">(optional)</span>
          </label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              id="place-input"
              placeholder="e.g. Jumeirah, Bandra West, Manhattan"
              value={place}
              onChange={(e) => onPlaceChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {place && (
              <button
                type="button"
                onClick={() => onPlaceChange("")}
                className="absolute right-2.5 text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* City Suggestions as interactive pills */}
      {availableCities.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-500">
              Popular cities in {selectedCountryItem?.name}:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableCities.map((cityName) => {
              const isActive = city.trim().toLowerCase() === cityName.toLowerCase();
              return (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => handleCityPillClick(cityName)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1 border",
                    isActive
                      ? "bg-primary text-white border-primary font-medium shadow-xs"
                      : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200/80 hover:border-neutral-300"
                  )}
                >
                  <span>{cityName}</span>
                  {isActive && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Search String Builder Preview (Highlighted Box) */}
      <div className="rounded-lg border border-neutral-200/80 bg-linear-to-r from-neutral-50 via-slate-50 to-neutral-50 p-3.5 transition-all">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-primary/10 text-primary mt-0.5 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Live Search Query Builder
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-neutral-200/70 text-neutral-700">
                Google Maps &amp; Instagram
              </span>
            </div>
            <p className="text-sm font-medium text-neutral-900 truncate">
              {hasAnyLocation ? (
                <span>
                  Searching: <span className="font-semibold text-primary font-mono">{liveSearchPreview}</span>
                </span>
              ) : (
                <span className="text-neutral-400 italic">
                  Select a country and enter a city or specific area above to build your search target.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
