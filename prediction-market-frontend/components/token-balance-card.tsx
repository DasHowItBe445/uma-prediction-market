"use client";

import { Coins, Copy, ExternalLink } from "lucide-react";
import { ETHERSCAN_BASE_URL } from "@/lib/contract";
import { toast } from "sonner";

interface TokenBalanceCardProps {
  label: string;
  balance: string;
  tokenAddress: string;
  variant?: "outcome1" | "outcome2";
}

export function TokenBalanceCard({
  label,
  balance,
  tokenAddress,
  variant = "outcome1",
}: TokenBalanceCardProps) {
  const isOutcome1 = variant === "outcome1";

  const copyAddress = () => {
    navigator.clipboard.writeText(tokenAddress);
    toast.success("Token address copied");
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-medium ${
            isOutcome1 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {label}
        </span>
        <Coins
          className={`h-4 w-4 ${
            isOutcome1 ? "text-emerald-400/50" : "text-rose-400/50"
          }`}
        />
      </div>

      <p className="text-2xl font-bold text-card-foreground mb-2">{balance}</p>

      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground truncate flex-1">
          {tokenAddress.slice(0, 10)}...{tokenAddress.slice(-6)}
        </span>
        <button
          onClick={copyAddress}
          className="text-muted-foreground hover:text-card-foreground transition-colors"
          aria-label="Copy token address"
        >
          <Copy className="h-3 w-3" />
        </button>
        <a
          href={`${ETHERSCAN_BASE_URL}/address/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-card-foreground transition-colors"
          aria-label="View token on Etherscan"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
