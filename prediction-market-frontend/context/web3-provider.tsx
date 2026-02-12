"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, Contract, type JsonRpcSigner } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "@/lib/contract";

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
interface Web3State {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  contract: Contract | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
}

const defaultState: Web3State = {
  account: null,
  chainId: null,
  isConnecting: false,
  isCorrectNetwork: false,
  provider: null,
  signer: null,
  contract: null,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
};

const Web3Context = createContext<Web3State>(defaultState);

export function useWeb3() {
  return useContext(Web3Context);
}

// -------------------------------------------------------------------
// Provider
// -------------------------------------------------------------------
export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  // Build contract instance whenever signer changes
  useEffect(() => {
    if (!provider || !signer || !account || !isCorrectNetwork) {
      setContract(null);
      return;
    }
  
    try {
      console.log("Creating contract with:");
      console.log("Address:", CONTRACT_ADDRESS);
      console.log("Signer:", signer);
      console.log("Chain OK:", isCorrectNetwork);
  
      const c = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
  
      console.log("Contract ready:", c);
  
      setContract(c);
    } catch (err) {
      console.error("Contract init failed:", err);
      setContract(null);
    }
  }, [provider, signer, account, isCorrectNetwork]);

  // ------------------------------------------------------------------
  // Initialise provider from window.ethereum
  // ------------------------------------------------------------------
  const initProvider = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const bp = new BrowserProvider(window.ethereum);
    setProvider(bp);

    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) {
        const s = await bp.getSigner();
        setAccount(accounts[0]);
        setSigner(s);
      }

      const cId: string = await window.ethereum.request({
        method: "eth_chainId",
      });
      setChainId(Number.parseInt(cId, 16));
    } catch {
      // silent — wallet not yet connected
    }
  }, []);

  useEffect(() => {
    initProvider();
  }, [initProvider]);

  // ------------------------------------------------------------------
  // Subscribe to wallet events
  // ------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
      } else {
        setAccount(accounts[0]);
        if (provider) {
          const s = await provider.getSigner();
          setSigner(s);
        }
      }
    };

    const handleChainChanged = (cId: string) => {
      setChainId(Number.parseInt(cId, 16));
      // Refresh provider on chain change
      initProvider();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [provider, initProvider]);

  // ------------------------------------------------------------------
  // Connect wallet
  // ------------------------------------------------------------------
  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      const bp = new BrowserProvider(window.ethereum);
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const s = await bp.getSigner();
      const cId: string = await window.ethereum.request({
        method: "eth_chainId",
      });

      setProvider(bp);
      setAccount(accounts[0]);
      setSigner(s);
      setChainId(Number.parseInt(cId, 16));
    } catch {
      // User rejected
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ------------------------------------------------------------------
  // Disconnect (client-side only — clears state)
  // ------------------------------------------------------------------
  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setContract(null);
  }, []);

  // ------------------------------------------------------------------
  // Switch to Sepolia
  // ------------------------------------------------------------------
  const switchNetwork = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (err: unknown) {
      // If chain not added, add it
      const switchError = err as { code?: number };
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: "Sepolia Testnet",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnecting,
        isCorrectNetwork,
        provider,
        signer,
        contract,
        connect,
        disconnect,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

// -------------------------------------------------------------------
// Global window type extension for MetaMask
// -------------------------------------------------------------------
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
