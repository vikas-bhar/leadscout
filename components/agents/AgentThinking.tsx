"use client";

import { CheckCircle2, Bot, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentThinkingProps {
  steps: string[];
  currentStep?: string;
  isComplete?: boolean;
  className?: string;
}

export function AgentThinking({
  steps,
  currentStep,
  isComplete = false,
  className,
}: AgentThinkingProps) {
  return (
    <div
      className={cn(
        "bg-neutral-950 rounded-xl p-4 font-mono text-xs border border-neutral-800 text-neutral-300 space-y-3 shadow-lg",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2 text-emerald-400">
          <Bot className="h-4 w-4" />
          <span className="font-sans font-semibold text-xs tracking-wide">
            LeadScout Agent Reasoning Engine
          </span>
        </div>

        {!isComplete ? (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span className="animate-pulse">Thinking in steps...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Analysis Complete</span>
          </div>
        )}
      </div>

      {/* Steps log */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {steps.map((step, i) => (
          <div key={i} className="text-neutral-300 text-[11px] flex items-start gap-2">
            <span className="text-emerald-400 shrink-0 font-bold">✓</span>
            <span className="leading-tight">{step}</span>
          </div>
        ))}

        {!isComplete && currentStep && (
          <div className="text-white text-[11px] flex items-start gap-2 pt-0.5">
            <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0 mt-0.5" />
            <span className="text-amber-200 leading-tight">{currentStep}</span>
          </div>
        )}
      </div>

      {isComplete && (
        <div className="text-emerald-400 text-[11px] border-t border-neutral-800 pt-2 flex items-center gap-1.5 font-sans">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Client psychology, business intelligence & pitch sequence ready.</span>
        </div>
      )}
    </div>
  );
}
