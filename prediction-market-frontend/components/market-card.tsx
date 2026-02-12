"use client";

import Link from "next/link";
import { formatEther } from "ethers";
import { ArrowRight, Coins } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { MarketData } from "@/lib/contract";

interface MarketCardProps {
  market: MarketData;
}

export function MarketCard({ market }: MarketCardProps) {
  const status = market.resolved ? "resolved" : "active";

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="group glass rounded-xl p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-mono text-muted-foreground">
            #{market.id}
          </span>
          <StatusBadge status={status} />
        </div>

        {/* Description */}
        <h3 className="text-sm font-semibold leading-relaxed mb-4 line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
          {market.description || "Untitled Market"}
        </h3>

        {/* Outcomes */}
        <div className="flex gap-2 mb-4">
          <span className="flex-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 text-center truncate">
            {market.outcome1}
          </span>
          <span className="text-xs text-muted-foreground self-center">vs</span>
          <span className="flex-1 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 text-center truncate">
            {market.outcome2}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span>{formatEther(market.reward)} ETH</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            View Details
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
