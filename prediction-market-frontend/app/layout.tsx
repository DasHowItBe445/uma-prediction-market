import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";
import { Providers } from "./providers";
import { Web3Provider } from "@/context/web3-provider";

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "PredictX - Decentralized Prediction Market",
  description:
    "A decentralized prediction market powered by UMA Optimistic Oracle V3 on Ethereum Sepolia.",
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen">
        <Providers>
          <Web3Provider>
            {children}
          </Web3Provider>
        </Providers>

        <Toaster
          position="top-right"
          toastOptions={{
            className: "glass",
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--card-foreground))",
            },
          }}
        />
      </body>
    </html>
  );
}
