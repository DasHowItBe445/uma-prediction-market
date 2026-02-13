"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { formatEther } from "ethers";
import { useWeb3 } from "@/context/web3-provider";
import { useContract } from "@/hooks/use-contract";
import { StatusBadge } from "@/components/status-badge";
import { TokenBalanceCard } from "@/components/token-balance-card";
import { TransactionModal } from "@/components/transaction-modal";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Coins,
  Shield,
  Loader2,
  ExternalLink,
  Copy,
  Zap,
  CheckCircle2,
  RefreshCcw,
  Ban,
} from "lucide-react";
import { ETHERSCAN_BASE_URL, CONTRACT_ADDRESS } from "@/lib/contract";
import type { MarketData } from "@/lib/contract";
import { toast } from "sonner";

interface MarketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { id } = use(params);
  const marketId = id;
  const { account } = useWeb3();
  const {
    getMarketDetails,
    createOutcomeTokens,
    assertMarket,
    redeemOutcomeTokens,
    settleOutcomeTokens,
    isLoading,
    error,
    txHash,
    resetState,
  } = useContract();

  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");

  // Load market data
  useEffect(() => {
    async function load() {
      if (!account) return;
      setLoading(true);
      try {
        const data = await getMarketDetails(marketId);
        setMarket(data);
      } catch (err) {
        console.error("Failed to load market", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [account, marketId, getMarketDetails]);

  const copyContractAddress = () => {
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    toast.success("Contract address copied");
  };

  // ------------------------------------------------------------------
  // Action handlers
  // ------------------------------------------------------------------
  const handleMint = async () => {
    setModalTitle("Minting Outcome Tokens");
    setModalDesc("Creating outcome tokens for this market.");
    setShowModal(true);
    try {
      await createOutcomeTokens(marketId, "1");
      toast.success("Outcome tokens minted!");
      const data = await getMarket(marketId);
      setMarket(data);
    } catch {
      toast.error("Failed to mint tokens");
    }
  };

  const handleAssert = async (outcome: string) => {
    setModalTitle("Asserting Outcome");
    setModalDesc(`Asserting "${outcome}" as the market result via UMA Oracle.`);
    setShowModal(true);
    try {
      await assertMarket(marketId, outcome);
      toast.success("Outcome asserted!");
      const data = await getMarket(marketId);
      setMarket(data);
    } catch {
      toast.error("Failed to assert outcome");
    }
  };

  const handleRedeem = async () => {
    setModalTitle("Redeeming Tokens");
    setModalDesc("Redeeming your outcome tokens.");
    setShowModal(true);
    try {
      await redeemOutcomeTokens(marketId, "1");
      toast.success("Tokens redeemed!");
      const data = await getMarket(marketId);
      setMarket(data);
    } catch {
      toast.error("Failed to redeem tokens");
    }
  };

  const handleSettle = async () => {
    setModalTitle("Settling Market");
    setModalDesc("Settling outcome tokens based on oracle resolution.");
    setShowModal(true);
    try {
      await settleOutcomeTokens(marketId);
      toast.success("Market settled!");
      const data = await getMarket(marketId);
      setMarket(data);
    } catch {
      toast.error("Failed to settle market");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetState();
  };

  // ------------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-grid min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="bg-grid min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="glass rounded-xl p-12 text-center max-w-md">
          <Ban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Market Not Found
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This market does not exist or the contract is not deployed.
          </p>
          <Link href="/markets">
            <Button variant="outline" className="gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" />
              Back to Markets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = market.resolved ? "resolved" : "active";

  return (
    <div className="bg-grid min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        {/* Back */}
        <Link href="/markets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Markets
        </Link>

        {/* Header Card */}
        <div className="glass rounded-xl p-6 lg:p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <span className="text-xs font-mono text-muted-foreground">
              Market #{market.id}
            </span>
            <StatusBadge status={status} />
          </div>

          <h1 className="text-xl font-bold text-foreground mb-4 text-balance">
            {market.description || "Untitled Market"}
          </h1>

          {/* Outcomes */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Outcome 1</p>
              <p className="text-sm font-semibold text-emerald-400">
                {market.outcome1}
              </p>
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              vs
            </div>
            <div className="flex-1 rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Outcome 2</p>
              <p className="text-sm font-semibold text-rose-400">
                {market.outcome2}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Reward</p>
              <div className="flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                {market.reward} USDC
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bond Required</p>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {formatEther(market.requiredBond)} ETH
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Resolution</p>
              <span className="text-sm font-semibold text-foreground">
                {market.resolved ? "Resolved" : "Pending"}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Asserted</p>
              <span className="text-sm font-semibold text-foreground">
                {market.assertedOutcome || "None"}
              </span>
            </div>
          </div>

          {/* Contract link */}
          <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap items-center gap-3">
            <button
              onClick={copyContractAddress}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="h-3 w-3" />
              Copy Contract Address
            </button>
            <a
              href={`${ETHERSCAN_BASE_URL}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View Contract
            </a>
          </div>
        </div>

        {/* Token Balances */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
          <TokenBalanceCard
            label={`${market.outcome1} Token`}
            balance="0"
            tokenAddress={market.outcome1Token}
            variant="outcome1"
          />
          <TokenBalanceCard
            label={`${market.outcome2} Token`}
            balance="0"
            tokenAddress={market.outcome2Token}
            variant="outcome2"
          />
        </div>

        {/* Actions */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              onClick={handleMint}
              disabled={isLoading || market.resolved}
              variant="outline"
              className="gap-2 bg-transparent justify-start"
            >
              <Zap className="h-4 w-4 text-primary" />
              Mint Outcome Tokens
            </Button>

            <Button
              onClick={() => handleAssert(market.outcome1)}
              disabled={isLoading || market.resolved}
              variant="outline"
              className="gap-2 bg-transparent justify-start"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Assert: {market.outcome1}
            </Button>

            <Button
              onClick={() => handleAssert(market.outcome2)}
              disabled={isLoading || market.resolved}
              variant="outline"
              className="gap-2 bg-transparent justify-start"
            >
              <CheckCircle2 className="h-4 w-4 text-rose-400" />
              Assert: {market.outcome2}
            </Button>

            <Button
              onClick={handleRedeem}
              disabled={isLoading}
              variant="outline"
              className="gap-2 bg-transparent justify-start"
            >
              <RefreshCcw className="h-4 w-4 text-primary" />
              Redeem Tokens
            </Button>

            <Button
              onClick={handleSettle}
              disabled={isLoading || !market.resolved}
              variant="outline"
              className="gap-2 bg-transparent justify-start sm:col-span-2"
            >
              <Shield className="h-4 w-4 text-primary" />
              Settle Market
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        open={showModal}
        onClose={handleCloseModal}
        txHash={txHash}
        isLoading={isLoading}
        error={error}
        title={modalTitle}
        description={modalDesc}
      />
    </div>
  );
}
