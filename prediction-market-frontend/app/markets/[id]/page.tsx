  "use client";

  import { useEffect, useState, use } from "react";
  import Link from "next/link";
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
      contract,
      getMarketDetails,
      getAssertionForMarket,
      getAssertionDetails,
      getOutcomeTokenBalance,
      disputeAssertion,
      createOutcomeTokens,
      assertMarket,
      redeemOutcomeTokens,
      settleMarket,
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
    const [assertionId, setAssertionId] = useState<string | null>(null);
    const [assertionDetails, setAssertionDetails] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [yesBalance, setYesBalance] = useState("0");
    const [noBalance, setNoBalance] = useState("0");

    const hasActiveAssertion =
      assertionId &&
      assertionId !==
        "0x0000000000000000000000000000000000000000000000000000000000000000";

        useEffect(() => {
          async function load() {
            if (!account) return;
            setLoading(true);
        
            try {
              const data = await getMarketDetails(marketId);
        
              if (!data) return;
        
              setMarket(data);
        
              //  Load token balances
              const yes = await getOutcomeTokenBalance(data.outcome1Token);
              const no = await getOutcomeTokenBalance(data.outcome2Token);
        
              setYesBalance(yes);
              setNoBalance(no);
        
              const assertion = await getAssertionForMarket(marketId);
              setAssertionId(assertion);
        
              if (
                assertion &&
                assertion !==
                  "0x0000000000000000000000000000000000000000000000000000000000000000"
              ) {
                const details = await getAssertionDetails(assertion);
                setAssertionDetails(details);
              } else {
                setAssertionDetails(null);
              }
        
              console.log("Assertion status:", assertion);
        
            } catch (err) {
              console.error("Failed to load market", err);
            } finally {
              setLoading(false);
            }
          }
        
          load();
        }, [
          account,
          marketId,
          getMarketDetails,
          getAssertionForMarket,
          getAssertionDetails,
          getOutcomeTokenBalance,
        ]);

    useEffect(() => {
      if (!assertionId) return;
    
      const interval = setInterval(async () => {
        try {
          const details = await getAssertionDetails(assertionId);
          setAssertionDetails(details);
    
          const updated = await getMarketDetails(marketId);
          setMarket(updated);
        } catch (e) {
          console.error("Polling failed", e);
        }
      }, 10000); // 10 seconds
    
      return () => clearInterval(interval);
    }, [assertionId, marketId, getAssertionDetails, getMarketDetails]);

    const copyContractAddress = () => {
      navigator.clipboard.writeText(CONTRACT_ADDRESS);
      toast.success("Contract address copied");
    };

    useEffect(() => {
      if (!assertionDetails?.expirationTime) return;
    
      const interval = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const diff = assertionDetails.expirationTime - now;
    
        setTimeLeft(diff > 0 ? diff : 0);
      }, 1000);
    
      return () => clearInterval(interval);
    }, [assertionDetails]);

    useEffect(() => {
      if (!contract) return;
    
      const filter = contract.filters.MarketResolved();
    
      contract.on(filter, (id) => {
        console.log("Market resolved:", id);
      });
    
      return () => {
        contract.removeAllListeners(filter);
      };
    }, [contract]);   

    function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  return `${h}h ${m}m ${s}s`;
}

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
    
        const data = await getMarketDetails(marketId);
    
        if (data) {
          setMarket(data);
    
          const yes = await getOutcomeTokenBalance(data.outcome1Token);
          const no = await getOutcomeTokenBalance(data.outcome2Token);
    
          setYesBalance(yes);
          setNoBalance(no);
        }
    
      } catch {
        toast.error("Failed to mint tokens");
      }
    };

    const handleAssert = async (outcome: string) => {
      setModalTitle("Asserting Outcome");
      setModalDesc(`Asserting "${outcome}" as the market result.`);
      setShowModal(true);
    
      try {
        await assertMarket(marketId, outcome);
    
        toast.success("Outcome asserted!");
    
        // 🔥 REFRESH EVERYTHING
        const assertion = await getAssertionForMarket(marketId);
        setAssertionId(assertion);
    
        if (
          assertion &&
          assertion !==
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          const details = await getAssertionDetails(assertion);
          setAssertionDetails(details);
        }
    
        const data = await getMarketDetails(marketId);
        setMarket(data);
    
      } catch (e: any) {
        console.error(e);
        toast.error(e?.reason || "Failed to assert outcome");
      }
    };    

    const handleRedeem = async () => {
      setModalTitle("Redeeming Tokens");
      setModalDesc("Redeeming your outcome tokens.");
      setShowModal(true);
    
      try {
        await redeemOutcomeTokens(marketId, "1");
    
        toast.success("Tokens redeemed!");
    
        const data = await getMarketDetails(marketId);
    
        if (data) {
          setMarket(data);
    
          const yes = await getOutcomeTokenBalance(data.outcome1Token);
          const no = await getOutcomeTokenBalance(data.outcome2Token);
    
          setYesBalance(yes);
          setNoBalance(no);
        }
    
      } catch {
        toast.error("Failed to redeem tokens");
      }
    };

    const handleSettle = async () => {
      if (!assertionId) {
        toast.error("No active assertion");
        return;
      }
    
      setModalTitle("Resolving Market");
      setModalDesc("Triggering oracle settlement.");
      setShowModal(true);
    
      try {
        await settleMarket(marketId);
    
        toast.success("Market resolved!");
    
        const updated = await getMarketDetails(marketId);
        setMarket(updated);
    
        const newAssertion = await getAssertionForMarket(marketId);
    
        if (
          newAssertion &&
          newAssertion !==
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          setAssertionId(newAssertion);
    
          const details = await getAssertionDetails(newAssertion);
          setAssertionDetails(details);
        } else {
          setAssertionId(null);
          setAssertionDetails(null);
        }
    
      } catch (e: any) {
        console.error(e);
        toast.error(e?.reason || "Settlement failed");
      }
    };  

    const handleCloseModal = () => {
      setShowModal(false);
      resetState();
    };

    const handleDispute = async () => {
      if (!assertionId) {
        toast.error("No active assertion");
        return;
      }
    
      setModalTitle("Disputing Assertion");
      setModalDesc("Challenging the asserted outcome.");
      setShowModal(true);
    
      try {
        await disputeAssertion(assertionId);
    
        toast.success("Assertion disputed!");
    
        const details = await getAssertionDetails(assertionId);
        setAssertionDetails(details);
    
      } catch (e: any) {
        console.error(e);
        toast.error(e?.reason || "Dispute failed");
      }
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

    const oracleState = assertionDetails
      ? getAssertionState(assertionDetails)
      : "NO_ASSERTION";

    const isAsserter =
      assertionDetails &&
      account &&
      assertionDetails.asserter?.toLowerCase() === account.toLowerCase();

    function getAssertionState(details: any) {
      if (!details) return "NO_ASSERTION";
    
      const now = Math.floor(Date.now() / 1000);
      const expiry = Number(details.expirationTime);
    
      if (details.settled) return "SETTLED";
    
      if (details.disputed) return "DISPUTED";
    
      if (now < expiry) return "LIVENESS";
    
      if (now >= expiry) return "READY_TO_SETTLE";
    
      return "UNKNOWN";
    }        

    return (
      <>
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

{/* Reward */}
<div>
  <p className="text-xs text-muted-foreground mb-1">Reward</p>
  <div className="flex items-center gap-1.5">
    <Coins className="h-3.5 w-3.5 text-primary" />
    <span className="text-sm font-semibold text-foreground">
      {market.reward} USDC
    </span>
  </div>
</div>

{/* Bond */}
<div>
  <p className="text-xs text-muted-foreground mb-1">Bond Required</p>
  <div className="flex items-center gap-1.5">
    <Shield className="h-3.5 w-3.5 text-primary" />
    <span className="text-sm font-semibold text-foreground">
      {market.requiredBond} USDC
    </span>
  </div>
</div>

{/* Resolution */}
<div>
  <p className="text-xs text-muted-foreground mb-1">Resolution</p>
  <span className="text-sm font-semibold text-foreground">
    {market.resolved ? "Resolved" : "Pending"}
  </span>
</div>

{/* Asserted */}
<div>
  <p className="text-xs text-muted-foreground mb-1">Asserted</p>
  <span className="text-sm font-semibold text-foreground">
    {market.assertedOutcome || "None"}
  </span>
</div>

</div>

              {/* Oracle Status */}
{assertionId && assertionDetails && (
  <div className="mt-6 p-4 rounded-lg border border-border bg-secondary/30 space-y-2">

    <h3 className="text-sm font-semibold text-foreground">
      Oracle Status
    </h3>

    {timeLeft !== null && timeLeft > 0 && (
  <p className="text-sm text-yellow-400">
    ⏳ Time Left: {formatTime(timeLeft)}
  </p>
)}

    {/* Oracle State */}
    <p className="text-sm font-medium">
      Oracle State:{" "}
      <span className="text-primary">
        {getAssertionState(assertionDetails)}
      </span>
    </p>

    {/* Asserter */}
    <p className="text-xs text-muted-foreground">
      Asserter: {assertionDetails.asserter}
    </p>

    {/* Dispute Status */}
    <p className="text-xs text-muted-foreground">
      Disputed:{" "}
      <span
        className={
          assertionDetails.disputed
            ? "text-red-400"
            : "text-emerald-400"
        }
      >
        {assertionDetails.disputed ? "Yes" : "No"}
      </span>
    </p>

    {/* Warning */}
    {assertionDetails.disputed && (
      <p className="text-xs text-red-400">
        ⚠ This assertion is under dispute
      </p>
    )}

    {/* Expiry */}
    <p className="text-xs text-muted-foreground">
      Expires:{" "}
      {new Date(
        Number(assertionDetails.expirationTime) * 1000
      ).toLocaleString()}
    </p>

    {/* Info */}
    {!assertionDetails.settled && (
      <p className="text-xs text-muted-foreground">
        This assertion can be disputed during the liveness period.
      </p>
    )}

  </div>
)}

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
              balance={yesBalance}
              tokenAddress={market.outcome1Token}
              variant="outcome1"
            />
            <TokenBalanceCard
              label={`${market.outcome2} Token`}
              balance={noBalance}
              tokenAddress={market.outcome2Token}
              variant="outcome2"
            />
          </div>

          {/* Actions */}
<div className="glass rounded-xl p-6">
  <h2 className="text-sm font-semibold text-foreground mb-4">
    Actions
  </h2>

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

    {assertionDetails &&
      oracleState === "LIVENESS" &&
      !isAsserter && (
        <Button
          onClick={handleDispute}
          disabled={isLoading}
          variant="outline"
          className="gap-2 bg-transparent justify-start"
        >
          <Ban className="h-4 w-4 text-red-400" />
          Dispute Assertion
        </Button>
    )}

    <Button
      onClick={handleSettle}
      disabled={
        isLoading ||
        !assertionDetails ||
        assertionDetails.settled ||
        oracleState !== "READY_TO_SETTLE"
      }
      variant="outline"
      className="gap-2 bg-transparent justify-start sm:col-span-2"
    >
      <Shield className="h-4 w-4 text-primary" />
      Settle Market
    </Button>

  </div> 
</div> 

</div> 
</div> 
<TransactionModal
  open={showModal}
  onClose={handleCloseModal}
  txHash={txHash}
  isLoading={isLoading}
  error={error}
  title={modalTitle}
  description={modalDesc}
/>
</>
);
}