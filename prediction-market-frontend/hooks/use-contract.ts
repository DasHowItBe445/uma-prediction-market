"use client";

import { useState, useCallback } from "react";
import { parseEther, formatEther } from "ethers";
import { useWeb3 } from "@/context/web3-provider";
import { getERC20Contract } from "@/lib/erc20";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import type { MarketData } from "@/lib/contract";

export function useContract() {
  const { contract, account, signer } = useWeb3();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /* ---------------- Utils ---------------- */

  const resetState = useCallback(() => {
    setError(null);
    setTxHash(null);
  }, []);

  /* ---------------- Internal: Auto Approve ---------------- */

  const ensureAllowance = useCallback(
    async (amountWei: bigint) => {
      if (!contract || !signer || !account) {
        throw new Error("Wallet not connected");
      }

      if (amountWei === 0n) return;

      const tokenAddress: string = await contract.currency();

      const token = getERC20Contract(tokenAddress, signer);

      const allowance: bigint = await token.allowance(
        account,
        CONTRACT_ADDRESS
      );

      console.log("Current allowance:", allowance.toString());

      if (allowance < amountWei) {
        console.log("Approving tokens...");

        const tx = await token.approve(
          CONTRACT_ADDRESS,
          amountWei
        );

        await tx.wait();

        console.log("Approval confirmed");
      }
    },
    [contract, signer, account]
  );

  /* ---------------- Initialize Market ---------------- */

  const initializeMarket = useCallback(
    async (
      outcome1: string,
      outcome2: string,
      description: string,
      reward: string,
      requiredBond: string
    ) => {
      if (!contract || !signer || !account) {
        throw new Error("Wallet not connected");
      }

      resetState();
      setIsLoading(true);

      try {
        const rewardWei = parseEther(reward);
        const bondWei = parseEther(requiredBond);

        // 1. Ensure ERC20 approval
        await ensureAllowance(rewardWei);

        // 2. Create market
        const tx = await contract.initializeMarket(
          outcome1,
          outcome2,
          description,
          rewardWei,
          bondWei
        );

        setTxHash(tx.hash);

        await tx.wait();

        return tx.hash;

      } catch (err: any) {
        const message =
          err?.reason ||
          err?.message ||
          "Transaction failed";

        setError(message);
        throw err;

      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, account, ensureAllowance, resetState]
  );

  /* ---------------- Create Outcome Tokens ---------------- */

  const createOutcomeTokens = useCallback(
    async (marketId: string, amount: string) => {
      if (!contract) throw new Error("Not connected");

      resetState();
      setIsLoading(true);

      try {
        const amtWei = parseEther(amount);

        await ensureAllowance(amtWei);

        const tx = await contract.createOutcomeTokens(
          marketId,
          amtWei
        );

        setTxHash(tx.hash);

        await tx.wait();

        return tx.hash;

      } finally {
        setIsLoading(false);
      }
    },
    [contract, ensureAllowance, resetState]
  );

  /* ---------------- Assert Market ---------------- */

  const assertMarket = useCallback(
    async (marketId: string, outcome: string) => {
      if (!contract) throw new Error("Not connected");

      resetState();
      setIsLoading(true);

      try {
        const tx = await contract.assertMarket(
          marketId,
          outcome
        );

        setTxHash(tx.hash);

        await tx.wait();

        return tx.hash;

      } finally {
        setIsLoading(false);
      }
    },
    [contract, resetState]
  );

  /* ---------------- Redeem ---------------- */

  const redeemOutcomeTokens = useCallback(
    async (marketId: string, amount: string) => {
      if (!contract) throw new Error("Not connected");

      resetState();
      setIsLoading(true);

      try {
        const tx = await contract.redeemOutcomeTokens(
          marketId,
          parseEther(amount)
        );

        setTxHash(tx.hash);

        await tx.wait();

        return tx.hash;

      } finally {
        setIsLoading(false);
      }
    },
    [contract, resetState]
  );

  /* ---------------- Settle ---------------- */

  const settleOutcomeTokens = useCallback(
    async (marketId: string) => {
      if (!contract) throw new Error("Not connected");

      resetState();
      setIsLoading(true);

      try {
        const tx = await contract.settleOutcomeTokens(marketId);

        setTxHash(tx.hash);

        await tx.wait();

        return tx.hash;

      } finally {
        setIsLoading(false);
      }
    },
    [contract, resetState]
  );

  /* ---------------- Reads ---------------- */

  const getMarket = useCallback(
    async (id: string): Promise<MarketData | null> => {
      if (!contract) return null;

      try {
        return await contract.getMarket(id);
      } catch {
        return null;
      }
    },
    [contract]
  );

  const getMarketCount = useCallback(async (): Promise<number> => {
    if (!contract) return 0;

    try {
      const count = await contract.marketCount();
      return Number(count);
    } catch {
      return 0;
    }
  }, [contract]);

  const fetchAllMarkets = useCallback(async (): Promise<MarketData[]> => {
    const count = await getMarketCount();
    const markets: MarketData[] = [];

    for (let i = 0; i < count; i++) {
      const market = await getMarket(i.toString());
      if (market) markets.push(market);
    }

    return markets;
  }, [getMarketCount, getMarket]);

  /* ---------------- Export ---------------- */

  return {
    isLoading,
    error,
    txHash,
    account,

    initializeMarket,
    createOutcomeTokens,
    assertMarket,
    redeemOutcomeTokens,
    settleOutcomeTokens,

    getMarket,
    getMarketCount,
    fetchAllMarkets,

    formatEther,
  };
}
