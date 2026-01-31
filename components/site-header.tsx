'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/ui/button"
import { ClientWalletWrapper } from "@/components/client-wallet-wrapper"
import { UnifiedWalletStatus } from "@/components/wallet/unified-wallet-status"
import { Logo } from "@/components/ui/logo"
import { Rocket, ShoppingBag, Settings, LayoutDashboard, Waves } from "lucide-react"
import { cn } from "@/lib/utils"

export function SiteHeader() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <header className="sticky top-0 z-50 border-b border-primary/30 bg-background/85 backdrop-blur-lg">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none retro-grid opacity-15" />
                <Link href="/" className="flex items-center gap-3 font-bold text-lg md:text-xl mr-6 relative z-10">
                    <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]">
                        <Logo className="size-7 text-primary" />
                        <span className="uppercase tracking-[0.24em] text-[11px] text-primary">Stacks Lab</span>
                    </div>
                    <span className="hidden lg:inline-block text-muted-foreground text-xs tracking-[0.28em]">Bitcoin-Native Console</span>
                </Link>
                <nav className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar relative z-10">
                    <Link href="/chat">
                        <Button variant={isActive('/chat') ? "secondary" : "ghost"} size="sm" className="gap-2 px-3 rounded-full">
                            <LayoutDashboard className="size-4" />
                            <span className="hidden sm:inline">Chat</span>
                        </Button>
                    </Link>
                    <Link href="/launchpad">
                        <Button variant={isActive('/launchpad') ? "secondary" : "ghost"} size="sm" className="gap-2 px-3 rounded-full">
                            <Rocket className="size-4" />
                            <span className="hidden sm:inline">Launchpad</span>
                        </Button>
                    </Link>
                    <Link href="/marketplace">
                        <Button variant={isActive('/marketplace') ? "secondary" : "ghost"} size="sm" className="gap-2 px-3 rounded-full">
                            <ShoppingBag className="size-4" />
                            <span className="hidden sm:inline">Marketplace</span>
                        </Button>
                    </Link>
                    <Link href="/settings">
                        <Button variant={isActive('/settings') ? "secondary" : "ghost"} size="sm" className="gap-2 px-3 rounded-full">
                            <Settings className="size-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </Button>
                    </Link>
                </nav>
                <div className="flex items-center gap-3 relative z-10">
                    {pathname === '/' && (
                        <Button variant="outline" className="hidden sm:flex rounded-full border-primary/40 hover:bg-primary/10" asChild>
                            <Link href="/chat">
                                Launch App
                            </Link>
                        </Button>
                    )}
                    <ClientWalletWrapper />
                </div>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/50">
                    <Waves className="size-10" />
                </div>
            </div>
            <UnifiedWalletStatus />
        </header>
    )
}
