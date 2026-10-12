"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  variant?: "full" | "icon" | "compact";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  className?: string;
  showBadge?: boolean;
  theme?: "light" | "dark" | "auto";
}

export function AppLogo({
  variant = "compact",
  size = "md",
  href = "/",
  className,
  showBadge = false,
  theme = "auto",
}: AppLogoProps) {
  const sizeMap = {
    sm: {
      box: "h-7 w-7",
      img: 28,
      text: "text-base",
      badge: "text-[10px] px-1.5 py-0.2",
    },
    md: {
      box: "h-9 w-9",
      img: 36,
      text: "text-lg",
      badge: "text-xs px-2 py-0.5",
    },
    lg: {
      box: "h-11 w-11",
      img: 44,
      text: "text-xl",
      badge: "text-xs px-2.5 py-0.5",
    },
    xl: {
      box: "h-14 w-14",
      img: 56,
      text: "text-2xl",
      badge: "text-xs px-2.5 py-1",
    },
  };

  const currentSize = sizeMap[size];

  const logoMark = (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shrink-0 flex items-center justify-center transition-transform hover:scale-105 shadow-sm border border-blue-500/30 bg-neutral-950",
        currentSize.box
      )}
    >
      <Image
        src="/images/logo.jpg"
        alt="LeadScout Logo"
        width={currentSize.img}
        height={currentSize.img}
        className="w-full h-full object-cover rounded-xl"
        priority
      />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
    </div>
  );

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      {logoMark}

      {variant !== "icon" && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-extrabold tracking-tight transition-colors",
                currentSize.text,
                theme === "dark"
                  ? "text-white"
                  : theme === "light"
                  ? "text-neutral-900"
                  : "text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
              )}
            >
              LeadScout
            </span>
            {showBadge && (
              <span
                className={cn(
                  "font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
                  currentSize.badge
                )}
              >
                AI Scout
              </span>
            )}
          </div>
          {variant === "full" && (
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium tracking-tight">
              AI Client Finder for Freelancers
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
}
