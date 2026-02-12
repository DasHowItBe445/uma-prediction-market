"use client";

import { MarketForm } from "@/components/market-form";
import { Info } from "lucide-react";

export default function CreateMarketPage() {
  return (
    <div className="bg-grid min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-2xl px-4 py-12 lg:px-8 lg:py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Create a Prediction Market
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Define two possible outcomes and set the reward and bond parameters.
            Your market will be deployed on Sepolia and resolvable via UMA
            Oracle.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-xl p-6 lg:p-8">
          <MarketForm />
        </div>

        {/* Info Section */}
        <div className="mt-6 glass rounded-xl p-5">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Reward</strong> is the
                amount paid to the asserter who correctly resolves the market.
              </p>
              <p>
                <strong className="text-foreground">Bond</strong> is the stake
                required to assert an outcome. It is returned if the assertion
                is not disputed.
              </p>
              <p>
                Markets are resolved through UMA&apos;s Optimistic Oracle V3
                dispute resolution mechanism.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
