"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEther } from "ethers";
import { useWeb3 } from "@/context/web3-provider";
import { useContract } from "@/hooks/use-contract";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Loader2,
  Briefcase,
  Coins,
  ArrowRight,
  Copy,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ETHERSCAN_BASE_URL } from "@/lib/contract";
import type { MarketData } from "@/lib/contract";
import { toast } from "sonner";

export default function PortfolioPage() {
  const { account, connect, isConnecting, provider } = useWeb3();
  const { fetchAllMarkets } = useContract();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string>("0");

  // Load markets and balance
  useEffect(() => {
    async function load() {
      if (!account || !provider) return;
      setLoading(true);
      try {
        const [data, bal] = await Promise.all([
          fetchAllMarkets(),
          provider.getBalance(account),
        ]);
        setMarkets(data);
        setBalance(formatEther(bal));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account, provider, fetchAllMarkets]);

  const activePositions = markets.filter((m) => !m.resolved);
  const settledPositions = markets.filter((m) => m.resolved);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success("Address copied");
    }
  };

  if (!account) {
    return (
      <div className="bg-grid min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="glass rounded-xl p-12 text-center max-w-md">
          <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Connect Wallet
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to view your portfolio.
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Portfolio</h1>
          <p className="text-sm text-muted-foreground">
            Your positions, balances, and market activity.
          </p>
        </div>

        {/* Wallet Info */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Connected Wallet
              </p>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                <span className="font-mono text-sm text-foreground">
                  {account}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy address"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <a
                  href={`${ETHERSCAN_BASE_URL}/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="View on Etherscan"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">ETH Balance</p>
              <p className="text-2xl font-bold text-foreground">
                {Number.parseFloat(balance).toFixed(4)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ETH
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Positions
              </span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : activePositions.length}
            </p>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Settled Markets
              </span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : settledPositions.length}
            </p>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending Rewards
              </span>
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : "0 ETH"}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Active Positions */}
        {!loading && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Active Positions
            </h2>
            {activePositions.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No active positions. Participate in a market to see them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activePositions.map((market) => (
                  <PortfolioRow key={market.id} market={market} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Settled Positions */}
        {!loading && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Settled Markets
            </h2>
            {settledPositions.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No settled markets yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {settledPositions.map((market) => (
                  <PortfolioRow key={market.id} market={market} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Portfolio Row Component
// ------------------------------------------------------------------
function PortfolioRow({ market }: { market: MarketData }) {
  const status = market.resolved ? "resolved" : "active";

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="glass rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              #{market.id}
            </span>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm font-medium text-foreground truncate">
            {market.description || "Untitled Market"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
              {market.outcome1}
            </span>
            <span className="rounded bg-rose-500/10 px-2 py-1 text-xs text-rose-400">
              {market.outcome2}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Coins className="h-3 w-3" />
            {formatEther(market.reward)} ETH
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
