"use client";

import { useState, useCallback } from "react";
import { useWeb3 } from "@/context/web3-provider";
import { getERC20Contract } from "@/lib/erc20";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import type { MarketData } from "@/lib/contract";
import { parseUnits, formatUnits } from "ethers";
import { ethers } from "ethers";

let tokenDecimalsCache: number | null = null;

async function resolveDecimals(
  contract: any,
  signer: any
): Promise<number> {
  if (tokenDecimalsCache !== null) return tokenDecimalsCache;

  const tokenAddr = await contract.currency();
  const token = getERC20Contract(tokenAddr, signer);

  const d = await token.decimals();

  tokenDecimalsCache = Number(d);

  return tokenDecimalsCache;
}

let tokenDecimals: number | null = null;

export function useContract() {

  console.log("HOOK CONTRACT:", CONTRACT_ADDRESS);
  const { contract, account, signer } = useWeb3();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  /* ---------------- Utils ---------------- */

  const resetState = useCallback(() => {
    setError(null);
    setTxHash(null);
  }, []);

/* ---------------- Token Decimals ---------------- */

const getTokenDecimals = useCallback(async () => {
  if (tokenDecimals !== null) return tokenDecimals;

  if (!contract || !signer) {
    throw new Error("Not connected");
  }

  const tokenAddress = await contract.currency();
  const token = getERC20Contract(tokenAddress, signer);

  const decimals = await token.decimals();
  tokenDecimals = decimals;

  return decimals;
}, [contract, signer]);

/* ---------------- Internal: Auto Approve ---------------- */  

const ensureAllowance = useCallback(
  async (needed: bigint) => {
    if (!contract || !signer || !account) {
      throw new Error("Wallet not connected");
    }

    if (needed === 0n) return;

    const tokenAddr = await contract.currency();
    const token = getERC20Contract(tokenAddr, signer);

    const bal = await token.balanceOf(account);

    if (bal < needed) {
      throw new Error("Insufficient token balance");
    }

    const allowance = await token.allowance(account, CONTRACT_ADDRESS);

    if (allowance < needed) {
      const tx = await token.approve(CONTRACT_ADDRESS, needed);
      await tx.wait();
    }
  },
  [contract, signer, account]
);

  /* ---------------- Initialize Market ---------------- */

  const initializeMarket = useCallback(
    async (
      o1: string,
      o2: string,
      desc: string,
      reward: string,
      bond: string
    ) => {
      if (!contract || !signer || !account) {
        throw new Error("Wallet not connected");
      }
  
      resetState();
      setIsLoading(true);
  
      try {
        const decimals = await resolveDecimals(contract, signer);
  
        const rewardWei = parseUnits(reward || "0", decimals);
        const bondWei = parseUnits(bond || "0", decimals);
  
        const total = rewardWei + bondWei;
  
        await ensureAllowance(total);

        const duration = 7 * 24 * 60 * 60;
  
        const tx = await contract.initializeMarket(
          o1,
          o2,
          desc,
          rewardWei,
          bondWei,
          7 * 24 * 60 * 60
        );
  
        setTxHash(tx.hash);
  
        await tx.wait();
  
        return tx.hash;
      } catch (e: any) {
        setError(e?.reason || e?.message || "Transaction failed");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, account, ensureAllowance, resetState]
  );  

  /* ---------------- Create Outcome Tokens ---------------- */

  const createOutcomeTokens = useCallback(
    async (id: string, amount: string) => {
      if (!contract || !signer || !account) {
        throw new Error("Wallet not connected");
      }
  
      resetState();
      setIsLoading(true);
  
      try {
        const decimals = await resolveDecimals(contract, signer);
  
        const amtWei = parseUnits(amount, decimals);
  
        await ensureAllowance(amtWei);
  
        const tx = await contract.createOutcomeTokens(id, amtWei);
  
        setTxHash(tx.hash);
  
        await tx.wait();
  
        return tx.hash;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, account, ensureAllowance, resetState]
  );  

  /* ---------------- Assert Market ---------------- */

  const getUMAStore = useCallback(async (): Promise<string> => {
    if (!contract || !signer) {
      throw new Error("Not connected");
    }
  
    const finderAddr = await contract.finder();
  
    const finder = new ethers.Contract(
      finderAddr,
      [
        "function getImplementationAddress(bytes32) view returns (address)"
      ],
      signer
    );
  
    const STORE_ID = ethers.id("Store");
  
    return await finder.getImplementationAddress(STORE_ID);
  }, [contract, signer]);  

  const ensureAllowanceFor = useCallback(
    async (spender: string, needed: bigint) => {
      if (!contract || !signer || !account) {
        throw new Error("Wallet not connected");
      }
  
      if (needed === 0n) return;
  
      const tokenAddr = await contract.currency();
      const token = getERC20Contract(tokenAddr, signer);
  
      const bal = await token.balanceOf(account);
  
      if (bal < needed) {
        throw new Error("Insufficient token balance");
      }
  
      let allowance = await token.allowance(account, spender);
  
      // 🔁 Force approve if not enough
      if (allowance < needed) {
  
        console.log("Approving", spender, "for", needed.toString());
  
        const tx = await token.approve(
          spender,
          ethers.MaxUint256 // 🔥 IMPORTANT
        );
  
        await tx.wait();
  
        // 🔁 Recheck (important)
        allowance = await token.allowance(account, spender);
  
        console.log("New allowance:", allowance.toString());
  
        if (allowance < needed) {
          throw new Error("Approve failed");
        }
      }
    },
    [contract, signer, account]
  );  

  const assertMarket = useCallback(
    async (marketId: string, outcome: string) => {
      if (!contract || !signer || !account) {
        throw new Error("Not connected");
      }
  
      resetState();
      setIsLoading(true);
  
      try {
        const market = await contract.getMarketDetails(marketId);
  
        const bond: bigint = market[4];
  
        const ooAddr = await contract.oo();
        await ensureAllowanceFor(ooAddr, bond);
  
        const tx = await contract.assertMarket(
          marketId,
          outcome
        );
  
        setTxHash(tx.hash);
  
        await tx.wait();
  
        return tx.hash;
  
      } catch (e: any) {
        console.error("Assert failed:", e);
        setError(e?.reason || e?.message || "Assertion failed");
        throw e;
  
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, account, ensureAllowanceFor, resetState]
  );  

  /* ---------------- Redeem ---------------- */

  const redeemOutcomeTokens = useCallback(
    async (marketId: string, amount: string) => {
      if (!contract) throw new Error("Not connected");
  
      resetState();
      setIsLoading(true);
  
      try {
        const decimals = await getTokenDecimals();
  
        const amtWei = parseUnits(amount, decimals);
  
        const tx = await contract.redeemOutcomeTokens(
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
    [contract, resetState, getTokenDecimals]
  );  

  /* ---------------- Resolve Market (Oracle) ---------------- */

const settleMarket = useCallback(
  async (marketId: string) => {
    if (!contract) throw new Error("Not connected");

    resetState();
    setIsLoading(true);

    try {
      const tx = await contract.settleMarket(marketId);

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

const getAllMarketIds = useCallback(async (): Promise<string[]> => {
  if (!contract) return [];

  try {
    return await contract.getAllMarkets();
  } catch {
    return [];
  }
}, [contract]);

const getOutcomeTokenBalance = useCallback(
  async (tokenAddress: string): Promise<string> => {
    if (!signer || !account) return "0";

    const token = getERC20Contract(tokenAddress, signer);

    const decimals = await token.decimals();
    const bal = await token.balanceOf(account);

    return formatUnits(bal, decimals);
  },
  [signer, account]
);

const getMarketDetails = useCallback(
  async (id: string) => {
    if (!contract || !signer) return null;

    try {
      const data = await contract.getMarketDetails(id);

      const decimals = await resolveDecimals(contract, signer);

      return {
        id,
        outcome1: data[0],
        outcome2: data[1],
        description: data[2],
        reward: formatUnits(data[3], decimals),
        requiredBond: formatUnits(data[4], decimals),
        outcome1Token: data[5],
        outcome2Token: data[6],
        resolved: data[7],
      };
    } catch {
      return null;
    }
  },
  [contract, signer]
);

const getAssertionForMarket = useCallback(
  async (id: string): Promise<string | null> => {
    if (!contract) return null;

    try {
      return await contract.getAssertionForMarket(id);
    } catch {
      return null;
    }
  },
  [contract, getTokenDecimals]
);

const fetchAllMarkets = useCallback(async () => {
  if (!contract) return [];

  try {
    const ids: string[] = await contract.getAllMarkets();

    const markets = await Promise.all(
      ids.map(async (id: string) => {
        const data = await contract.getMarketDetails(id);

        return {
          id,
          outcome1: data[0],
          outcome2: data[1],
          description: data[2],
          reward: data[3],
          requiredBond: data[4],
          outcome1Token: data[5],
          outcome2Token: data[6],
          resolved: data[7],
        };
      })
    );

    return markets;

  } catch (err) {
    console.error("Failed to fetch markets", err);
    return [];
  }
}, [contract]);

const getTokenBalance = useCallback(async (): Promise<string> => {
  if (!contract || !signer || !account) return "0";

  const tokenAddress = await contract.currency();
  const token = getERC20Contract(tokenAddress, signer);

  const decimals = await getTokenDecimals();

  const bal = await token.balanceOf(account);

  return formatUnits(bal, decimals);
}, [contract, signer, account, getTokenDecimals]);

const getAssertionDetails = useCallback(
  async (marketId: string) => {
    if (!contract) return null;

    try {
      const result = await contract.getAssertionData(marketId);

      const assertionId = result[0];
      const settled = result[1];
      const disputed = result[2];
      const expirationTime = Number(result[3]);

      if (!assertionId || assertionId === ethers.ZeroHash) {
        return {
          assertionId: null,
          settled: false,
          disputed: false,
          expirationTime: 0,
          state: "NO_ASSERTION",
        };
      }

      const now = Math.floor(Date.now() / 1000);

      let state = "LIVE";

      if (settled) {
        state = "SETTLED";
      } else if (disputed) {
        state = "DISPUTED";
      } else if (now >= expirationTime) {
        state = "READY_TO_SETTLE";
      }

      return {
        assertionId,
        settled,
        disputed,
        expirationTime,
        state,
      };

    } catch (e) {
      console.error("Assertion fetch failed", e);
      return null;
    }
  },
  [contract]
);
const disputeAssertion = useCallback(
  async (marketId: string) => {
    if (!contract || !signer || !account)
      throw new Error("Not connected");

    resetState();
    setIsLoading(true);

    try {
      const tx = await contract.disputeAssertion(marketId);

      setTxHash(tx.hash);
      await tx.wait();

      return tx.hash;

    } finally {
      setIsLoading(false);
    }
  },
  [contract, signer, account, resetState]
);

  /* ---------------- Export ---------------- */

  return {
    contract,
    isLoading,
    error,
    txHash,
    account,
    resetState,  
    initializeMarket,
    createOutcomeTokens,
    assertMarket,
    redeemOutcomeTokens,
    settleMarket,
    settleOutcomeTokens,
    getOutcomeTokenBalance,

    disputeAssertion,

    getTokenBalance,
  
    getAllMarketIds,
    getMarketDetails,
    getAssertionForMarket,
    getAssertionDetails,
    fetchAllMarkets,
  
  };  
}
