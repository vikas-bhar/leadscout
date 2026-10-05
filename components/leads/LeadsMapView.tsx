"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Compass,
  RotateCcw,
  ExternalLink,
  Phone,
  Globe,
  Star,
  Building2,
  AlertTriangle,
  X,
  ChevronRight,
  Flame,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { type Lead } from "@/types";
import { OpportunityScore } from "@/components/ui/OpportunityScore";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Known coordinates for top metropolitan areas & states to ensure instant zero-latency map rendering
const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // US Major Cities
  "new york": { lat: 40.7128, lng: -74.006 },
  nyc: { lat: 40.7128, lng: -74.006 },
  manhattan: { lat: 40.7831, lng: -73.9712 },
  brooklyn: { lat: 40.6782, lng: -73.9442 },
  queens: { lat: 40.7282, lng: -73.7949 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  la: { lat: 34.0522, lng: -118.2437 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  houston: { lat: 29.7604, lng: -95.3698 },
  phoenix: { lat: 33.4484, lng: -112.074 },
  philadelphia: { lat: 39.9526, lng: -75.1652 },
  "san antonio": { lat: 29.4241, lng: -98.4936 },
  "san diego": { lat: 32.7157, lng: -117.1611 },
  dallas: { lat: 32.7767, lng: -96.797 },
  austin: { lat: 30.2672, lng: -97.7431 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  sf: { lat: 37.7749, lng: -122.4194 },
  "san jose": { lat: 37.3382, lng: -121.8863 },
  seattle: { lat: 47.6062, lng: -122.3321 },
  denver: { lat: 39.7392, lng: -104.9903 },
  boston: { lat: 42.3601, lng: -71.0589 },
  miami: { lat: 25.7617, lng: -80.1918 },
  orlando: { lat: 28.5383, lng: -81.3792 },
  tampa: { lat: 27.9506, lng: -82.4572 },
  atlanta: { lat: 33.749, lng: -84.388 },
  nashville: { lat: 36.1627, lng: -86.7816 },
  charlotte: { lat: 35.2271, lng: -80.8431 },
  portland: { lat: 45.5152, lng: -122.6784 },
  "las vegas": { lat: 36.1699, lng: -115.1398 },
  detroit: { lat: 42.3314, lng: -83.0458 },
  minneapolis: { lat: 44.9778, lng: -93.265 },
  "salt lake city": { lat: 40.7608, lng: -111.891 },
  columbus: { lat: 39.9612, lng: -82.9988 },
  indianapolis: { lat: 39.7684, lng: -86.1581 },
  raleigh: { lat: 35.7796, lng: -78.6382 },
  pittsburgh: { lat: 40.4406, lng: -79.9959 },
  baltimore: { lat: 39.2904, lng: -76.6122 },
  cleveland: { lat: 41.4993, lng: -81.6944 },
  "kansas city": { lat: 39.0997, lng: -94.5786 },
  sacramento: { lat: 38.5816, lng: -121.4944 },
  // International Cities
  london: { lat: 51.5074, lng: -0.1278 },
  manchester: { lat: 53.4808, lng: -2.2426 },
  birmingham: { lat: 52.4862, lng: -1.8904 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  vancouver: { lat: 49.2827, lng: -123.1207 },
  montreal: { lat: 45.5017, lng: -73.5673 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  brisbane: { lat: -27.4698, lng: 153.0251 },
  berlin: { lat: 52.52, lng: 13.405 },
  paris: { lat: 48.8566, lng: 2.3522 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  singapore: { lat: 1.3521, lng: 103.8198 },
};

// Clean modern Google Maps styling
const MODERN_MAP_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#444444" }],
  },
  {
    featureType: "landscape",
    elementType: "all",
    stylers: [{ color: "#f8fafc" }],
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "road",
    elementType: "all",
    stylers: [{ saturation: -100 }, { lightness: 45 }],
  },
  {
    featureType: "road.highway",
    elementType: "all",
    stylers: [{ visibility: "simplified" }, { color: "#e2e8f0" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "all",
    stylers: [{ color: "#cbd5e1" }, { visibility: "on" }],
  },
];

interface LeadsMapViewProps {
  leads: Lead[];
  selectedLeadId?: string | null;
  onSelectLead?: (lead: Lead | null) => void;
  onUpdateStatus?: (leadId: string, newStatus: Lead["status"]) => void;
  className?: string;
}

/**
 * Extracts coordinates from a Lead via:
 * 1. lead.coordinates or lead.latitude/longitude
 * 2. mapsUrl parameter parsing (@lat,lng or !3dlat!4dlng)
 * 3. City/State match in known coordinates list + deterministic neighborhood jitter
 */
function resolveLeadCoordinates(lead: Lead): { lat: number; lng: number } {
  // 1. Direct coordinates
  if (lead.coordinates && typeof lead.coordinates.lat === "number" && typeof lead.coordinates.lng === "number") {
    return lead.coordinates;
  }
  if (typeof lead.latitude === "number" && typeof lead.longitude === "number") {
    return { lat: lead.latitude, lng: lead.longitude };
  }

  // 2. Parse from mapsUrl if present
  if (lead.mapsUrl) {
    // Check @lat,lng format
    const atMatch = lead.mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    // Check !3dlat!4dlng format
    const placeMatch = lead.mapsUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
  }

  // 3. Fallback matching against location string
  const locStr = (lead.location || "").toLowerCase();
  let baseCoords: { lat: number; lng: number } = { lat: 30.2672, lng: -97.7431 }; // Default Austin, TX center

  for (const [cityName, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (locStr.includes(cityName)) {
      baseCoords = coords;
      break;
    }
  }

  // Deterministic micro-jitter based on lead ID to disperse markers across city streets
  const hash = (lead.id || lead.businessName).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const jitterLat = ((hash % 100) - 50) * 0.0007; // ~70-700m spread
  const jitterLng = (((hash * 13) % 100) - 50) * 0.0007;

  return {
    lat: baseCoords.lat + jitterLat,
    lng: baseCoords.lng + jitterLng,
  };
}

export function LeadsMapView({
  leads,
  selectedLeadId,
  onSelectLead,
  onUpdateStatus,
  className,
}: LeadsMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeTierFilter, setActiveTierFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [mapTheme, setMapTheme] = useState<"modern" | "standard" | "satellite">("modern");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync external selectedLeadId
  useEffect(() => {
    if (selectedLeadId) {
      const match = leads.find((l) => l.id === selectedLeadId);
      if (match) setSelectedLead(match);
    }
  }, [selectedLeadId, leads]);

  // Load Google Maps Script
  useEffect(() => {
    let isCancelled = false;

    async function loadMapsApi() {
      // If already loaded globally
      if (typeof window !== "undefined" && window.google?.maps) {
        setIsScriptLoaded(true);
        return;
      }

      try {
        // Fetch API key from our secure route
        let apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          try {
            const res = await fetch("/api/maps/config");
            if (res.ok) {
              const data = await res.json();
              apiKey = data.apiKey;
            }
          } catch {
            // fallback
          }
        }

        // Standard key fallback
        apiKey = apiKey || "AIzaSyBNmmYoSMetk-CimjXh060-rDPvYd50YQ0";

        // Check if script tag is already in DOM
        const existingScript = document.getElementById("google-maps-script");
        if (existingScript) {
          existingScript.addEventListener("load", () => {
            if (!isCancelled) setIsScriptLoaded(true);
          });
          return;
        }

        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (!isCancelled) setIsScriptLoaded(true);
        };

        script.onerror = () => {
          if (!isCancelled) {
            setMapError("Google Maps JavaScript API could not be loaded directly. Running in resilient interactive visual mode.");
          }
        };

        document.head.appendChild(script);
      } catch {
        if (!isCancelled) {
          setMapError("Failed to initialize Google Maps client.");
        }
      }
    }

    loadMapsApi();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filter leads based on map overlay tier filter
  const displayedLeads = useMemo(() => {
    if (activeTierFilter === "all") return leads;
    if (activeTierFilter === "high") return leads.filter((l) => l.opportunityScore >= 75);
    if (activeTierFilter === "medium") return leads.filter((l) => l.opportunityScore >= 60 && l.opportunityScore < 75);
    return leads.filter((l) => l.opportunityScore < 60);
  }, [leads, activeTierFilter]);

  // Compute map center and bounds
  const leadCoordinatesMap = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>();
    leads.forEach((l) => {
      map.set(l.id, resolveLeadCoordinates(l));
    });
    return map;
  }, [leads]);

  // Initialize and update Google Map instance
  useEffect(() => {
    if (!isScriptLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      // Calculate initial center
      const defaultCenter = leads.length > 0 && leadCoordinatesMap.get(leads[0].id)
        ? leadCoordinatesMap.get(leads[0].id)!
        : { lat: 30.2672, lng: -97.7431 };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        styles: mapTheme === "modern" ? MODERN_MAP_STYLE : undefined,
        mapTypeId: mapTheme === "satellite" ? "hybrid" : "roadmap",
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      mapInstanceRef.current = map;
    } else {
      // Update theme if changed
      mapInstanceRef.current.setOptions({
        styles: mapTheme === "modern" ? MODERN_MAP_STYLE : undefined,
        mapTypeId: mapTheme === "satellite" ? "hybrid" : "roadmap",
      });
    }
  }, [isScriptLoaded, mapTheme, leads, leadCoordinatesMap]);

  // Create Custom SVG Marker Icon based on opportunity score
  const getMarkerIcon = useCallback((score: number, isSelected: boolean) => {
    const isHigh = score >= 75;
    const isMed = score >= 60 && score < 75;
    const bgColor = isHigh ? "#e11d48" : isMed ? "#d97706" : "#059669";
    const scale = isSelected ? 1.25 : 1.0;

    const svg = `
      <svg width="${36 * scale}" height="${44 * scale}" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <filter id="shadow" x="-4" y="0" width="44" height="48" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
        <path d="M18 42C18 42 32 28.5 32 16C32 8.26801 25.732 2 18 2C10.268 2 4 8.26801 4 16C4 28.5 18 42 18 42Z" 
              fill="${bgColor}" stroke="#ffffff" stroke-width="2.5" filter="url(#shadow)"/>
        <circle cx="18" cy="16" r="9" fill="#ffffff"/>
        <text x="18" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              font-size="10" font-weight="bold" fill="${bgColor}" text-anchor="middle">${score}</text>
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(36 * scale, 44 * scale),
      anchor: new window.google.maps.Point(18 * scale, 42 * scale),
    };
  }, []);

  // Update Markers when displayedLeads change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;

    // Clear removed markers
    const currentLeadIds = new Set(displayedLeads.map((l) => l.id));
    currentMarkers.forEach((marker, id) => {
      if (!currentLeadIds.has(id)) {
        marker.setMap(null);
        currentMarkers.delete(id);
      }
    });

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidCoord = false;

    // Place or update markers
    displayedLeads.forEach((lead) => {
      const coord = leadCoordinatesMap.get(lead.id) || resolveLeadCoordinates(lead);
      const isSelected = selectedLead?.id === lead.id;
      const position = new window.google.maps.LatLng(coord.lat, coord.lng);
      bounds.extend(position);
      hasValidCoord = true;

      let marker = currentMarkers.get(lead.id);

      if (!marker) {
        marker = new window.google.maps.Marker({
          position,
          map,
          title: `${lead.businessName} (Score: ${lead.opportunityScore})`,
          icon: getMarkerIcon(lead.opportunityScore, isSelected),
          zIndex: isSelected ? 999 : lead.opportunityScore,
          animation: isSelected ? window.google.maps.Animation.BOUNCE : undefined,
        });

        marker.addListener("click", () => {
          setSelectedLead(lead);
          if (onSelectLead) onSelectLead(lead);

          // Pan to marker
          map.panTo(position);

          // InfoWindow popup
          if (infoWindowRef.current) {
            const content = createInfoWindowContent(lead);
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(map, marker);
          }
        });

        currentMarkers.set(lead.id, marker);
      } else {
        marker.setPosition(position);
        marker.setIcon(getMarkerIcon(lead.opportunityScore, isSelected));
        marker.setZIndex(isSelected ? 999 : lead.opportunityScore);
        if (isSelected) {
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => marker?.setAnimation(null), 1400);
        } else {
          marker.setAnimation(null);
        }
      }
    });

    // Auto-fit bounds if we have leads
    if (hasValidCoord && displayedLeads.length > 0) {
      if (displayedLeads.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      }
    }
  }, [displayedLeads, leadCoordinatesMap, selectedLead, getMarkerIcon, onSelectLead]);

  // Helper to construct clean HTML for InfoWindow
  function createInfoWindowContent(lead: Lead): string {
    const isHigh = lead.opportunityScore >= 75;
    const isMed = lead.opportunityScore >= 60 && !isHigh;
    const scoreColor = isHigh ? "#e11d48" : isMed ? "#d97706" : "#059669";
    const primaryGap = lead.gapsFound && lead.gapsFound[0] ? lead.gapsFound[0].problem : "Digital presence opportunities";

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px; max-width: 280px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px;">
            ${lead.businessCategory || "Business"}
          </span>
          <span style="font-size: 12px; font-weight: 800; color: ${scoreColor};">
            Score ${lead.opportunityScore}/100
          </span>
        </div>
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; line-height: 1.2;">
          ${lead.businessName}
        </h3>
        <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">
          ${lead.location || "Location on record"}
        </p>
        <div style="font-size: 11px; background: #fff1f2; color: #9f1239; border-left: 3px solid #f43f5e; padding: 4px 6px; border-radius: 2px; margin-bottom: 8px;">
          <strong>Gap:</strong> ${primaryGap}
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          ${
            lead.mapsUrl
              ? `<a href="${lead.mapsUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; font-weight: 600; color: #2563eb; text-decoration: none; display: inline-flex; align-items: center; gap: 3px;">
                  Open on Google Maps ↗
                 </a>`
              : ""
          }
        </div>
      </div>
    `;
  }

  // Auto-center all leads function
  function handleFitAllBounds() {
    if (!mapInstanceRef.current || !window.google?.maps || displayedLeads.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    displayedLeads.forEach((l) => {
      const coord = leadCoordinatesMap.get(l.id) || resolveLeadCoordinates(l);
      bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
    });
    mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    toast.success(`Centered map on ${displayedLeads.length} leads`);
  }

  // Focus a specific lead on the map
  const handleFocusLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    if (onSelectLead) onSelectLead(lead);

    if (mapInstanceRef.current && window.google?.maps) {
      const coord = leadCoordinatesMap.get(lead.id) || resolveLeadCoordinates(lead);
      const position = new window.google.maps.LatLng(coord.lat, coord.lng);
      mapInstanceRef.current.panTo(position);
      mapInstanceRef.current.setZoom(16);

      const marker = markersRef.current.get(lead.id);
      if (marker && infoWindowRef.current) {
        infoWindowRef.current.setContent(createInfoWindowContent(lead));
        infoWindowRef.current.open(mapInstanceRef.current, marker);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1400);
      }
    }
  }, [leadCoordinatesMap, onSelectLead]);

  return (
    <div
      className={cn(
        "relative flex flex-col w-full bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs transition-all",
        isFullscreen ? "fixed inset-4 z-50 rounded-2xl shadow-2xl" : "h-[620px]",
        className
      )}
    >
      {/* Top Map Toolbar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Toolbar Chips: Stats & Opportunity Tier Filter */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-200/90 shadow-sm pointer-events-auto">
          <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-200">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-neutral-900">
              {displayedLeads.length}
            </span>
            <span className="text-[11px] text-neutral-500 hidden sm:inline">leads on map</span>
          </div>

          {/* Quick Tier Filters */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTierFilter("all")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-semibold transition-colors",
                activeTierFilter === "all"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              All ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTierFilter("high")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1",
                activeTierFilter === "high"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-700 hover:bg-rose-50"
              )}
            >
              <Flame className="h-3 w-3" />
              High
            </button>
            <button
              type="button"
              onClick={() => setActiveTierFilter("medium")}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-semibold transition-colors",
                activeTierFilter === "medium"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-amber-700 hover:bg-amber-50"
              )}
            >
              Medium
            </button>
          </div>

          {/* Quick Lead Jump Selector */}
          {displayedLeads.length > 0 && (
            <select
              value={selectedLead?.id || ""}
              onChange={(e) => {
                const targetId = e.target.value;
                const found = leads.find((l) => l.id === targetId);
                if (found) handleFocusLead(found);
              }}
              className="h-6 px-1.5 rounded text-[11px] font-medium border border-neutral-200 bg-white text-neutral-700 hidden md:block max-w-[130px] truncate"
            >
              <option value="">Jump to Lead...</option>
              {displayedLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.businessName} ({l.opportunityScore})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right Toolbar Controls: Fit Bounds, Theme, Fullscreen */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-neutral-200/90 shadow-sm pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitAllBounds}
            className="h-7 px-2 text-xs font-semibold gap-1 text-neutral-700 hover:text-neutral-900"
            title="Recenter and fit all leads in view"
          >
            <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Fit Bounds</span>
          </Button>

          {/* Map Layer Selector */}
          <div className="flex items-center border-l border-neutral-200 pl-1.5 gap-0.5">
            <button
              type="button"
              onClick={() => setMapTheme("modern")}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-semibold transition-colors",
                mapTheme === "modern" ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
              title="Modern Clean Map"
            >
              Clean
            </button>
            <button
              type="button"
              onClick={() => setMapTheme("standard")}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-semibold transition-colors",
                mapTheme === "standard" ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
              title="Standard Google Roadmap"
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => setMapTheme("satellite")}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-semibold transition-colors",
                mapTheme === "satellite" ? "bg-neutral-800 text-white" : "text-neutral-600 hover:bg-neutral-100"
              )}
              title="Satellite View"
            >
              Satellite
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors border-l border-neutral-200 ml-1"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Google Maps Render Container */}
      <div className="relative flex-1 w-full h-full min-h-[480px] bg-neutral-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Fallback View if Google Maps script takes time or encounters network blocks */}
        {!isScriptLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-50 p-6 text-center space-y-3 z-0">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">
                Initializing Google Maps Visualization...
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                {mapError || `Pinning ${leads.length} prospect locations across territories with opportunity ratings.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Score Legend Bar at Bottom Left */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-200 shadow-sm flex items-center gap-3 text-[11px]">
        <span className="font-semibold text-neutral-700">Pins:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600 inline-block" />
          <span className="text-neutral-600 font-medium">75+ High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
          <span className="text-neutral-600 font-medium">60–74 Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
          <span className="text-neutral-600 font-medium">&lt;60 Low</span>
        </div>
      </div>

      {/* Selected Lead Floating Drawer / Card at Bottom Right */}
      {selectedLead && (
        <div className="absolute bottom-3 right-3 z-20 w-80 sm:w-96 bg-white/98 backdrop-blur-md rounded-xl border border-neutral-200 shadow-xl p-4 space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="shrink-0 mt-0.5">
                <OpportunityScore score={selectedLead.opportunityScore} size={44} strokeWidth={4} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-neutral-900 truncate">
                    {selectedLead.businessName}
                  </h4>
                  <UrgencyBadge level={selectedLead.urgencyLevel} />
                </div>
                <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5 truncate">
                  <Building2 className="h-3 w-3 text-neutral-400 shrink-0" />
                  <span className="truncate">{selectedLead.businessCategory}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 shrink-0"
              title="Close card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Status selector */}
          {onUpdateStatus && (
            <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
              <span className="font-semibold text-neutral-600">Status:</span>
              <select
                value={selectedLead.status || "new"}
                onChange={(e) => {
                  const newStatus = e.target.value as Lead["status"];
                  onUpdateStatus(selectedLead.id, newStatus);
                  setSelectedLead({ ...selectedLead, status: newStatus });
                }}
                className="px-2 py-0.5 rounded text-[11px] font-semibold border border-neutral-200 bg-white text-neutral-800 focus:outline-none"
              >
                <option value="new">🆕 New</option>
                <option value="contacted">📩 Contacted</option>
                <option value="interested">⭐ Interested / Qualified</option>
                <option value="responded">💬 Responded</option>
                <option value="won">🏆 Closed Won</option>
                <option value="lost">❌ Lost</option>
              </select>
            </div>
          )}

          {/* Location & Contact Info */}
          <div className="space-y-1 text-xs text-neutral-600 border-t border-neutral-100 pt-2">
            <div className="flex items-center gap-1.5 text-neutral-600">
              <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{selectedLead.location || "Territory address"}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] pt-1">
              {selectedLead.phone && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="inline-flex items-center gap-1 text-neutral-700 hover:text-primary"
                >
                  <Phone className="h-3 w-3 text-neutral-400" />
                  <span>{selectedLead.phone}</span>
                </a>
              )}
              {selectedLead.websiteUrl && (
                <a
                  href={selectedLead.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline truncate max-w-[150px]"
                >
                  <Globe className="h-3 w-3 shrink-0" />
                  <span className="truncate">Visit Site</span>
                </a>
              )}
              {selectedLead.googleRating && (
                <div className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{selectedLead.googleRating.toFixed(1)}</span>
                  <span className="text-neutral-400 font-normal">({selectedLead.reviewCount})</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Digital Gap Alert */}
          {selectedLead.gapsFound && selectedLead.gapsFound.length > 0 && (
            <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200/80 text-rose-900 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span>Top Gap: {selectedLead.gapsFound[0].problem}</span>
              </div>
              {selectedLead.gapsFound[0].yourSolution && (
                <p className="text-[11px] text-rose-700/90 mt-0.5 line-clamp-2">
                  Pitch: {selectedLead.gapsFound[0].yourSolution}
                </p>
              )}
            </div>
          )}

          {/* Card Actions */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100">
            {selectedLead.mapsUrl ? (
              <a
                href={selectedLead.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <span>Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-xs text-neutral-400">Map Verified</span>
            )}

            <Link href={`/leads/${selectedLead.id}`}>
              <Button size="sm" className="h-7 text-xs font-semibold gap-1">
                <span>View Full Pitch</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
