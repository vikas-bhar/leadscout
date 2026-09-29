"use client";

import React from "react";
import { X, AlertCircle, Sparkles } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// BUTTON
// ─────────────────────────────────────────────
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  onClick,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs hover:shadow-sm transition-all duration-150",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-200 shadow-xs hover:shadow-sm transition-all duration-150 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-200",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-150 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-150",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-150",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-2.5 text-base rounded-xl",
    xl: "px-8 py-3.5 text-lg rounded-xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        variants[variant],
        sizes[size],
        "inline-flex items-center justify-center gap-2 font-semibold cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ children, className, hover = false, onClick, ...props }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-neutral-900 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-xs p-5",
        hover && "hover:shadow-md hover:border-gray-200 dark:hover:border-neutral-700 cursor-pointer transition-all duration-150",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "critical" | "high" | "medium" | "low";
  size?: "sm" | "md" | "lg";
}

export function Badge({ variant = "default", children, size = "md", className, ...props }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300",
    primary: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    danger: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    critical: "bg-red-600 text-white font-bold",
    high: "bg-orange-500 text-white font-bold",
    medium: "bg-amber-500 text-white font-bold",
    low: "bg-emerald-500 text-white font-bold",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 rounded-full",
    md: "text-xs px-2.5 py-1 rounded-full font-medium",
    lg: "text-sm px-3 py-1.5 rounded-full font-medium",
  };

  return (
    <span className={cn(variants[variant], sizes[size], "inline-flex items-center gap-1", className)} {...props}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, rightElement, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5 text-left">
      {label && <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(
            "w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150",
            leftIcon && "pl-10",
            rightElement && "pr-10",
            error && "border-red-300 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCORE RING
// ─────────────────────────────────────────────
export interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
}

export function ScoreRing({ score, size = "md", animate = true }: ScoreRingProps) {
  const sizes = {
    sm: { width: 40, strokeWidth: 3, fontSize: "10px" },
    md: { width: 52, strokeWidth: 4, fontSize: "13px" },
    lg: { width: 72, strokeWidth: 5, fontSize: "18px" },
    xl: { width: 96, strokeWidth: 6, fontSize: "24px" },
  };

  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const color = score >= 80 ? "#2563EB" : score >= 60 ? "#F59E0B" : score >= 40 ? "#F97316" : "#EF4444";

  return (
    <svg width={width} height={width} viewBox={`0 0 ${width} ${width}`} className="flex-shrink-0">
      <circle cx={width / 2} cy={width / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={strokeWidth} />
      <circle
        cx={width / 2}
        cy={width / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${width / 2} ${width / 2})`}
        style={animate ? { transition: "stroke-dashoffset 1s ease-in-out" } : {}}
      />
      <text
        x={width / 2}
        y={width / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// CREDIT PILL
// ─────────────────────────────────────────────
export function CreditPill({ credits, onClick }: { credits: number; onClick?: () => void }) {
  const color =
    credits > 100
      ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
      : credits > 20
      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all duration-150 hover:shadow-xs cursor-pointer",
        color
      )}
    >
      <Sparkles size={12} className="text-amber-500" />
      <span>{credits.toLocaleString()} credits</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────
export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "green" | "amber" | "red";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  animated = false,
  label,
}: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100);

  const colors = {
    blue: "bg-blue-600",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className="space-y-1 w-full">
      {label && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{label}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden", heights[size])}>
        <div
          className={cn(colors[color], heights[size], "rounded-full transition-all duration-500", animated && "animate-pulse")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SPINNER
// ─────────────────────────────────────────────
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div
      className={cn(
        "border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin",
        sizes[size]
      )}
    />
  );
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Modal({ open, onClose, title, description, children, size = "md" }: ModalProps) {
  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      {/* Modal */}
      <div className={cn("relative w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 z-10 border border-gray-100 dark:border-neutral-800", sizes[size])}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
        {title && <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h2>}
        {description && <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOAST (using sonner)
// ─────────────────────────────────────────────
export const toast = {
  success: (message: string) =>
    sonnerToast.success(message, {
      style: {
        background: "#F0FDF4",
        border: "1px solid #BBF7D0",
        color: "#15803D",
      },
    }),
  error: (message: string) =>
    sonnerToast.error(message, {
      style: {
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#DC2626",
      },
    }),
  info: (message: string) => sonnerToast(message),
  loading: (message: string) => sonnerToast.loading(message),
  credits: (credits: number, action: "added" | "used") =>
    sonnerToast(action === "added" ? `💎 ${credits} credits added` : `💎 ${credits} credits used`, {
      duration: 2000,
    }),
};
