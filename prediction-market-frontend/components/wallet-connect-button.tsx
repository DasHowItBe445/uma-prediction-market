"use client";

import { useWeb3 } from "@/context/web3-provider";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  LogOut,
  AlertTriangle,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ETHERSCAN_BASE_URL } from "@/lib/contract";
import { toast } from "sonner";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const {
    account,
    chainId,
    isConnecting,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork,
  } = useWeb3();

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success("Address copied to clipboard");
    }
  };

  // Not connected
  if (!account) {
    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 glow-primary"
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  // Wrong network
  if (!isCorrectNetwork) {
    return (
      <Button
        onClick={switchNetwork}
        variant="destructive"
        className="gap-2 transition-all duration-200"
      >
        <AlertTriangle className="h-4 w-4" />
        Switch to Sepolia
      </Button>
    );
  }

  // Connected & correct network
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-primary/30 hover:border-primary/60 transition-all duration-200 bg-transparent"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow" />
          <span className="font-mono text-sm">{truncateAddress(account)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">Connected to</p>
          <p className="text-sm font-mono">{truncateAddress(account)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sepolia Testnet (Chain ID: {chainId})
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress} className="gap-2 cursor-pointer">
          <Copy className="h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`${ETHERSCAN_BASE_URL}/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2 cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
            View on Etherscan
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="gap-2 text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
