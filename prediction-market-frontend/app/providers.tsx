"use client";

import type { ReactNode } from "react";
import { Web3Provider } from "@/context/web3-provider";
import { Navbar } from "@/components/navbar";
import { NetworkBanner } from "@/components/network-banner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <NetworkBanner />
      <Navbar />
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
    </Web3Provider>
  );
}
