"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "resolved" | "pending";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        {
          "bg-emerald-500/15 text-emerald-400": status === "active",
          "bg-sky-500/15 text-sky-400": status === "resolved",
          "bg-amber-500/15 text-amber-400": status === "pending",
        },
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-emerald-400 animate-pulse-glow": status === "active",
          "bg-sky-400": status === "resolved",
          "bg-amber-400 animate-pulse-glow": status === "pending",
        })}
      />
      {status === "active" && "Active"}
      {status === "resolved" && "Resolved"}
      {status === "pending" && "Pending"}
    </span>
  );
}
