"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OpportunityScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function OpportunityScore({
  score,
  size = 72,
  strokeWidth = 6,
  className,
}: OpportunityScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setOffset(circumference - (clamped / 100) * circumference);
    });
    return () => cancelAnimationFrame(frame);
  }, [clamped, circumference]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#378ADD"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-medium">{clamped}</span>
    </div>
  );
}
