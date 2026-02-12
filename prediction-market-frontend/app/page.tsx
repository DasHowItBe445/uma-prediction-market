"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWeb3 } from "@/context/web3-provider";
import { useContract } from "@/hooks/use-contract";
import { StatCard } from "@/components/stat-card";
import { MarketCard } from "@/components/market-card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  Wallet,
  Loader2,
} from "lucide-react";
import type { MarketData } from "@/lib/contract";

export default function DashboardPage() {
  const { account, connect, isConnecting } = useWeb3();
  const { fetchAllMarkets } = useContract();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);

  const totalMarkets = markets.length;
  const activeMarkets = markets.filter((m) => !m.resolved).length;
  const resolvedMarkets = markets.filter((m) => m.resolved).length;

  useEffect(() => {
    async function load() {
      if (!account) return;
      setLoading(true);
      try {
        const data = await fetchAllMarkets();
        setMarkets(data);
      } catch {
        // contract may not be deployed yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account, fetchAllMarkets]);

  return (
    <div className="bg-grid min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Powered by UMA Optimistic Oracle V3
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl text-balance">
              Decentralized Prediction Market
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Create, trade, and settle prediction markets on Ethereum Sepolia.
              Secure outcomes through UMA&apos;s optimistic oracle with
              trustless on-chain resolution.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              {account ? (
                <>
                  <Link href="/create">
                    <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-all duration-200">
                      <PlusCircle className="h-4 w-4" />
                      Create Market
                    </Button>
                  </Link>
                  <Link href="/markets">
                    <Button variant="outline" className="gap-2 bg-transparent transition-all duration-200">
                      Explore Markets
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-all duration-200"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect Wallet to Start"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {account && (
        <section className="mx-auto max-w-7xl px-4 pb-8 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total Markets"
              value={loading ? "..." : totalMarkets}
              icon={BarChart3}
              description="All markets created"
            />
            <StatCard
              title="Active Markets"
              value={loading ? "..." : activeMarkets}
              icon={TrendingUp}
              description="Open for participation"
            />
            <StatCard
              title="Resolved Markets"
              value={loading ? "..." : resolvedMarkets}
              icon={CheckCircle2}
              description="Settled with outcomes"
            />
          </div>
        </section>
      )}

      {/* Recent Markets */}
      {account && (
        <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Markets
            </h2>
            <Link href="/markets">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : markets.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-foreground mb-1">
                No Markets Yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to create a prediction market.
              </p>
              <Link href="/create">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <PlusCircle className="h-4 w-4" />
                  Create Market
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {markets.slice(0, 6).map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Not Connected State */}
      {!account && (
        <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Create Markets",
                desc: "Define custom prediction markets with two outcomes, set rewards and bonds.",
                icon: PlusCircle,
              },
              {
                title: "Trade Positions",
                desc: "Mint outcome tokens and trade your position on market results.",
                icon: TrendingUp,
              },
              {
                title: "Oracle Resolution",
                desc: "Outcomes are settled trustlessly via UMA Optimistic Oracle V3.",
                icon: CheckCircle2,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
