"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ETHERSCAN_BASE_URL } from "@/lib/contract";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  txHash: string | null;
  isLoading: boolean;
  error: string | null;
  title?: string;
  description?: string;
}

export function TransactionModal({
  open,
  onClose,
  txHash,
  isLoading,
  error,
  title = "Transaction",
  description = "Please confirm the transaction in your wallet.",
}: TransactionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          {/* Loading */}
          {isLoading && !error && (
            <>
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 h-12 w-12 rounded-full bg-primary/10 animate-ping" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {txHash
                  ? "Waiting for confirmation..."
                  : "Confirm in your wallet..."}
              </p>
            </>
          )}

          {/* Success */}
          {!isLoading && txHash && !error && (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <p className="text-sm font-medium text-card-foreground">
                Transaction Confirmed
              </p>
            </>
          )}

          {/* Error */}
          {error && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-destructive text-center max-w-[300px] line-clamp-3">
                {error}
              </p>
            </>
          )}

          {/* Tx hash link */}
          {txHash && (
            <a
              href={`${ETHERSCAN_BASE_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              View on Etherscan
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} size="sm">
            {isLoading ? "Close" : "Done"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
