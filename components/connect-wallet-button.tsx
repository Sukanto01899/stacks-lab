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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect Wallet</DialogTitle>
                    <DialogDescription>
                        Choose how you want to connect to Stacks Lab
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Button
                        variant="outline"
                        className="w-full h-16 justify-start gap-4 text-left hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                        onClick={handleStacksConnect}
                    >
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                            <Wallet className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <div className="font-semibold">Stacks Wallet</div>
                            <div className="text-xs text-muted-foreground">Leather, Xverse, or Hiro Wallet</div>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-16 justify-start gap-4 text-left hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
                        onClick={handleBitcoinConnect}
                    >
                        <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Bitcoin className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <div className="font-semibold">Bitcoin Wallet</div>
                            <div className="text-xs text-muted-foreground">Via WalletConnect (Reown)</div>
                        </div>
                    </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                    By connecting, you agree to our Terms of Service
                </p>
            </DialogContent>
        </Dialog>
    );
}
