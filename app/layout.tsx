import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stacks Lab | The Bitcoin Superapp",
  description: "Chat, trade, and launch tokens on Stacks. Fully on-chain and encrypted.",
  manifest: "/manifest.json",
  icons: {
    icon: "/orange_logo.svg",
    shortcut: "/orange_logo.svg",
    apple: "/orange_logo.svg",
  },
};

import { SiteHeader } from "@/components/site-header";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { Toaster } from "@/ui/toaster";
import { BitcoinProvider } from "@/lib/bitcoin-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${plexMono.variable} antialiased min-h-screen bg-background text-foreground tracking-tight retro-grid`}
      >
        <BitcoinProvider>
          <RealtimeProvider>
            <SiteHeader />
            {children}
            <Toaster />
          </RealtimeProvider>
        </BitcoinProvider>
      </body>
    </html>
  );
}
