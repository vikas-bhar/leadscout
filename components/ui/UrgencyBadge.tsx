import type { UrgencyLevel } from "@/types";
import { cn } from "@/lib/utils";

const STYLES: Record<UrgencyLevel, string> = {
  critical: "bg-danger-muted text-danger-foreground",
  high: "bg-danger-muted text-danger-foreground",
  medium: "bg-warning-muted text-warning-foreground",
  low: "bg-success-muted text-success-foreground",
};

interface UrgencyBadgeProps {
  level: UrgencyLevel;
  className?: string;
}

export function UrgencyBadge({ level, className }: UrgencyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
        STYLES[level],
        className
      )}
    >
      {level}
    </span>
  );
}
