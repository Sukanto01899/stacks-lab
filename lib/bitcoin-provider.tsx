"use client";

import { createAppKit } from "@reown/appkit/react";
import { BitcoinAdapter } from "@reown/appkit-adapter-bitcoin";
import { bitcoin, bitcoinTestnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { ReactNode, useEffect, useState } from "react";

// Get projectId from environment or use placeholder
const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  "c3157e10260481230e9d6824a7375620";

// Bitcoin networks - typed as tuple
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bitcoin, bitcoinTestnet];

// Set up Bitcoin Adapter
const bitcoinAdapter = new BitcoinAdapter({ projectId });

let appKitInitialized = false;

interface BitcoinProviderProps {
  children: ReactNode;
}

export function BitcoinProvider({ children }: BitcoinProviderProps) {
  // Lazily initialize AppKit once on the client to avoid repeated creates during Fast Refresh
  useEffect(() => {
    if (typeof window === "undefined" || appKitInitialized) return;

    const metadata = {
      name: "Stacks Lab",
      description: "The Bitcoin Superapp",
      url: window.location.origin || "https://stackslab.vercel.app",
      icons: ["/logo.svg"],
    };

    createAppKit({
      adapters: [bitcoinAdapter],
      networks,
      metadata,
      projectId,
      features: {
        analytics: true,
        email: false,
        socials: [],
      },
      themeMode: "dark",
      themeVariables: {
        "--w3m-accent": "#2563eb", // blue to match new theme
        "--w3m-border-radius-master": "10px",
      },
    });

    appKitInitialized = true;
  }, []);

  return <>{children}</>;
}

// Export hook to use Bitcoin wallet
export function useBitcoinWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check connection status properly with AppKit
  }, []);

  return { address, isConnected };
}
