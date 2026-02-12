"use client";

import { useWeb3 } from "@/context/web3-provider";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NetworkBanner() {
  const { account, isCorrectNetwork, switchNetwork } = useWeb3();

  // Only show if wallet is connected and on wrong network
  if (!account || isCorrectNetwork) return null;

  return (
    <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-3">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <p className="text-sm text-destructive font-medium">
          You are connected to the wrong network. Please switch to Sepolia Testnet.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={switchNetwork}
          className="h-7 text-xs"
        >
          Switch Network
        </Button>
      </div>
    </div>
  );
}
