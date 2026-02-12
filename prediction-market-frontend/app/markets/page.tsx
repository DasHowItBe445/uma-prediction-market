"use client";

import { useEffect, useState } from "react";
import { useWeb3 } from "@/context/web3-provider";
import { useContract } from "@/hooks/use-contract";
import { MarketCard } from "@/components/market-card";
import { Button } from "@/components/ui/button";
import { Loader2, List, Wallet } from "lucide-react";
import type { MarketData } from "@/lib/contract";

type Filter = "all" | "active" | "resolved";

export default function MarketsPage() {
  const { account, connect, isConnecting } = useWeb3();
  const { fetchAllMarkets } = useContract();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    async function load() {
      if (!account) return;
      setLoading(true);
      try {
        const data = await fetchAllMarkets();
        setMarkets(data);
      } catch {
        // contract may not be deployed
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account, fetchAllMarkets]);

  const filtered = markets.filter((m) => {
    if (filter === "active") return !m.resolved;
    if (filter === "resolved") return m.resolved;
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "resolved", label: "Resolved" },
  ];

  if (!account) {
    return (
      <div className="bg-grid min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="glass rounded-xl p-12 text-center max-w-md">
          <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Connect Wallet
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to browse prediction markets.
          </p>
          <Button
            onClick={connect}
            disabled={isConnecting}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-grid min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Markets</h1>
            <p className="text-sm text-muted-foreground">
              Browse all prediction markets on-chain.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <List className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-1">
              No Markets Found
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "No markets have been created yet."
                : `No ${filter} markets to display.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
