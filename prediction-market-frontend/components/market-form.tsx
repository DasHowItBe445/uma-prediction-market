"use client";

import React, { useState } from "react";

import { useContract } from "@/hooks/use-contract";
import { useWeb3 } from "@/context/web3-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TransactionModal } from "@/components/transaction-modal";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FormData {
  outcome1: string;
  outcome2: string;
  description: string;
  reward: string;
  requiredBond: string;
}

export function MarketForm() {
  const { account } = useWeb3();

  // ❌ Removed resetState (it doesn't exist)
  const { initializeMarket, isLoading, error, txHash } = useContract();

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<FormData>({
    outcome1: "",
    outcome2: "",
    description: "",
    reward: "",
    requiredBond: "",
  });

  /* ---------------- Helpers ---------------- */

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      outcome1: "",
      outcome2: "",
      description: "",
      reward: "",
      requiredBond: "",
    });
  };

  const isValid =
    form.outcome1.trim() &&
    form.outcome2.trim() &&
    form.description.trim() &&
    form.reward.trim() &&
    form.requiredBond.trim();

  /* ---------------- Handlers ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || !account) return;

    setShowModal(true);

    try {
      await initializeMarket(
        form.outcome1,
        form.outcome2,
        form.description,
        form.reward,
        form.requiredBond
      );

      toast.success("Market created successfully!");

      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create market");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Outcomes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="space-y-2">
            <Label
              htmlFor="outcome1"
              className="text-sm font-medium text-foreground"
            >
              Outcome 1
            </Label>

            <Input
              id="outcome1"
              placeholder="e.g. Yes"
              value={form.outcome1}
              onChange={(e) => updateField("outcome1", e.target.value)}
              className="bg-secondary/50 border-border focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="outcome2"
              className="text-sm font-medium text-foreground"
            >
              Outcome 2
            </Label>

            <Input
              id="outcome2"
              placeholder="e.g. No"
              value={form.outcome2}
              onChange={(e) => updateField("outcome2", e.target.value)}
              className="bg-secondary/50 border-border focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-medium text-foreground"
          >
            Market Description
          </Label>

          <Textarea
            id="description"
            placeholder="Describe the market question, e.g. Will ETH reach $5,000 by end of 2026?"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="bg-secondary/50 border-border focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Reward & Bond */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="space-y-2">
            <Label
              htmlFor="reward"
              className="text-sm font-medium text-foreground"
            >
              Reward Amount (ETH)
            </Label>

            <Input
              id="reward"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.01"
              value={form.reward}
              onChange={(e) => updateField("reward", e.target.value)}
              className="bg-secondary/50 border-border focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="requiredBond"
              className="text-sm font-medium text-foreground"
            >
              Required Bond (ETH)
            </Label>

            <Input
              id="requiredBond"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.005"
              value={form.requiredBond}
              onChange={(e) => updateField("requiredBond", e.target.value)}
              className="bg-secondary/50 border-border focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!isValid || !account || isLoading}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary transition-all duration-200 disabled:opacity-50"
        >
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {isLoading ? "Creating Market..." : "Create Market"}
        </Button>

        {!account && (
          <p className="text-center text-sm text-muted-foreground">
            Connect your wallet to create a market.
          </p>
        )}
      </form>

      {/* Transaction Modal */}
      <TransactionModal
        open={showModal}
        onClose={handleCloseModal}
        txHash={txHash}
        isLoading={isLoading}
        error={error}
        title="Creating Market"
        description="Your prediction market is being created on-chain."
      />
    </>
  );
}
