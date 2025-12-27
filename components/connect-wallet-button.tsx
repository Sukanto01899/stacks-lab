'use client';

import { Button } from '@/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { truncateAddress } from '@/lib/stacks';
import { Loader2, Wallet, Bitcoin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/ui/dialog";
import { useState } from 'react';
import { useAppKit } from '@reown/appkit/react';

export function ConnectWalletButton() {
    const { user, connectWallet, disconnectWallet, isMounted } = useWallet();
    const [dialogOpen, setDialogOpen] = useState(false);
    const { open } = useAppKit();

    const handleStacksConnect = async () => {
        await connectWallet();
        setDialogOpen(false);
    };

    const handleBitcoinConnect = async () => {
        await open();
        setDialogOpen(false);
    };

    if (!isMounted) {
        return (
            <Button disabled variant="outline" size="sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Loading...</span>
            </Button>
        );
    }

    if (user?.isAuthenticated) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 pl-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${user.address}`} />
                            <AvatarFallback className="text-xs">{(user.btcName || user.address)?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline">{user.btcName || truncateAddress(user.address)}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={`/profile/${user.btcName || user.address}`} className="cursor-pointer">
                            <UserIcon className="mr-2 h-4 w-4" />
                            Profile
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={disconnectWallet} className="text-red-500 focus:text-red-500 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">Connect</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border border-primary/40 bg-background/90 backdrop-blur-lg shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                <div className="absolute inset-0 pointer-events-none retro-grid opacity-20" />
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-lg flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        Connect to Stacks Lab
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Pick your lane: Stacks-first or Bitcoin via Reown.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-5 relative z-10">
                    <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        Neon bridge • Retro-safe connect
                    </div>
                    <Button
                        variant="outline"
                        className="w-full h-16 justify-start gap-4 text-left border-primary/40 hover:bg-primary/15 hover:border-primary/60 transition-all rounded-2xl"
                        onClick={handleStacksConnect}
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div className="font-semibold">Stacks Wallet</div>
                            <div className="text-xs text-muted-foreground">Leather, Xverse, Hiro</div>
                        </div>
                        <div className="ml-auto text-[10px] uppercase tracking-[0.18em] text-primary">Stacks</div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-16 justify-start gap-4 text-left border-secondary/40 hover:bg-secondary/15 hover:border-secondary/60 transition-all rounded-2xl"
                        onClick={handleBitcoinConnect}
                    >
                        <div className="h-10 w-10 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
                            <Bitcoin className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                            <div className="font-semibold">Bitcoin Wallet</div>
                            <div className="text-xs text-muted-foreground">WalletConnect via Reown</div>
                        </div>
                        <div className="ml-auto text-[10px] uppercase tracking-[0.18em] text-secondary-foreground">BTC</div>
                    </Button>
                </div>
                <div className="text-[11px] text-center text-muted-foreground">
                    By connecting, you agree to our Terms of Service.
                </div>
            </DialogContent>
        </Dialog>
    );
}
