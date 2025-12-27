'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar"
import { Button } from "@/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs"
import { Badge } from "@/ui/badge"
import { AvatarMint } from "@/components/profile/avatar-mint";
import { Copy, ExternalLink, MessageSquare, Settings, Wallet, Sparkles, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { resolveBnsName, truncateAddress, getStxBalance, readContract } from "@/lib/stacks"
import { getSbtcBalance } from "@/lib/sbtc"
import { SatTribute } from "@/components/wallet/sat-tribute"

import { cvToJSON, uintCV, contractPrincipalCV, principalCV } from "@stacks/transactions"
import { env } from "@/lib/config"
import { CONTRACTS } from "@/lib/contracts"

import { useState, useEffect, use } from "react"
import { useWallet } from "@/hooks/useWallet"

interface ProfilePageProps {
    params: Promise<{
        handle: string
    }>
}

interface TransactionActivity {
    tx_id: string;
    tx_status: string;
    tx_type: string;
    burn_block_time_iso: string;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const { handle } = use(params);
    const { user } = useWallet();
    const [address, setAddress] = useState<string>("");
    const [displayName, setDisplayName] = useState<string>(handle);
    const [sbtcBalance, setSbtcBalance] = useState<number>(0);
    const [stxBalance, setStxBalance] = useState<number>(0);
    const [reputation, setReputation] = useState<number>(0);
    const [userNfts, setUserNfts] = useState<number[]>([]);
    const [nftUris, setNftUris] = useState<Record<number, string>>({});
    const [recentActivity, setRecentActivity] = useState<TransactionActivity[]>([]);

    useEffect(() => {
        const loadProfile = async () => {
            let resolvedAddress = handle;
            let resolvedName = handle;

            if (handle.includes('.')) {
                const resolved = await resolveBnsName(handle, 'testnet');
                if (resolved) {
                    resolvedAddress = resolved;
                }
            } else {
                resolvedName = truncateAddress(handle);
                resolvedAddress = handle;
            }

            setAddress(resolvedAddress);
            setDisplayName(resolvedName);

            // Fetch sBTC Balance
            const balance = await getSbtcBalance(resolvedAddress, 'testnet');
            setSbtcBalance(balance);

            // Fetch STX Balance
            const stx = await getStxBalance(resolvedAddress, 'testnet');
            setStxBalance(stx);

            // Fetch Reputation
            try {
                const [repAddr, repName] = CONTRACTS.TESTNET.REPUTATION.split('.');
                const repData = await readContract(
                    repAddr,
                    repName,
                    'get-reputation',
                    [principalCV(resolvedAddress)],
                    'testnet'
                );
                if (repData && repData.value) {
                    setReputation(parseInt(repData.value.value));
                }
            } catch (e) {
                console.log("Failed to fetch reputation", e);
            }

            // Fetch User NFTs
            fetchUserNfts(resolvedAddress);

            // Fetch Activity
            fetchRecentActivity(resolvedAddress);
        };

        const fetchUserNfts = async (ownerAddress: string) => {
            try {
                const baseUrl = env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so';
                const contractId = env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? CONTRACTS.MAINNET.AVATARS : CONTRACTS.TESTNET.AVATARS;

                const res = await fetch(`${baseUrl}/extended/v1/tokens/nft/holdings?principal=${ownerAddress}&limit=50`);
                if (res.ok) {
                    const data = await res.json();

                    const myAvatars = data.results
                        .filter((nft: any) => nft.asset_identifier.startsWith(contractId))
                        .map((nft: any) => {
                            const match = nft.value.repr.match(/uint\((\d+)\)/);
                            return match ? parseInt(match[1]) : 0;
                        })
                        .filter((id: number) => id > 0);

                    setUserNfts(myAvatars);

                    // Fetch URIs for each NFT found
                    const uris: Record<number, string> = {};
                    const [cAddr, cName] = contractId.split('.');

                    await Promise.all(myAvatars.map(async (id: number) => {
                        try {
                            const uriData = await readContract(
                                cAddr,
                                cName,
                                'get-token-uri',
                                [uintCV(id)],
                                'testnet'
                            );
                            // uriData is (ok (some "url")) or (ok none)
                            if (uriData?.value?.value) {
                                uris[id] = uriData.value.value;
                            }
                        } catch (e) {
                            console.error(`Failed to fetch URI for token ${id}`, e);
                        }
                    }));
                    setNftUris(uris);
                }
            } catch (e) {
                console.error("Failed to fetch nfts", e);
            }
        };

        const fetchRecentActivity = async (ownerAddress: string) => {
            try {
                const baseUrl = env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so';
                const res = await fetch(`${baseUrl}/extended/v1/address/${ownerAddress}/transactions?limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setRecentActivity(data.results);
                }
            } catch (e) {
                console.error("Failed to fetch activity", e);
            }
        };

        loadProfile();
    }, [handle]);

    const sbtcDisplay = (sbtcBalance / 100000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    const stxDisplay = (stxBalance / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="container py-8 px-4 md:px-6 max-w-7xl mx-auto">
            {/* Top Profile Header */}
            <Card className="overflow-visible border-border/50 shadow-sm relative z-0 mb-8">
                {/* Banner */}
                <div className="h-48 md:h-60 bg-gradient-to-br from-primary/30 via-primary/10 to-background rounded-t-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
                </div>

                <CardContent className="pt-0 relative px-6 md:px-10 pb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Avatar */}
                        <div className="absolute -top-16 left-6">
                            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-[6px] border-background bg-background shadow-xl rounded-2xl">
                                <AvatarImage
                                    src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${displayName}`}
                                    className="object-cover"
                                />
                                <AvatarFallback className="rounded-2xl text-4xl">{displayName?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>

                        {/* User Info & Actions */}
                        <div className="pt-4 md:pt-6 flex-1 min-w-0 space-y-2">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight truncate">{displayName}</h1>
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1.5 font-medium">
                                        <div className="px-2 py-0.5 rounded-full bg-secondary/50 border border-border/50 font-mono text-xs">
                                            {truncateAddress(address)}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-secondary/50 rounded-full" onClick={() => {
                                            navigator.clipboard.writeText(address);
                                        }}>
                                            <Copy className="h-3 w-3" />
                                        </Button>

                                        {reputation > 0 && (
                                            <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">
                                                <ShieldCheck className="h-3 w-3" />
                                                Reputation: {reputation}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-base text-muted-foreground mt-4 max-w-2xl leading-relaxed">
                                        Building on Bitcoin layers. Stacks Lab Explorer.
                                    </p>
                                </div>

                                <div className="flex gap-3 shrink-0">
                                    <Button className="shadow-md font-semibold px-6" asChild size="default">
                                        <Link href={`/chat/${address}`}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            Chat
                                        </Link>
                                    </Button>
                                    {user?.address && address && user.address.toUpperCase() === address.toUpperCase() && (
                                        <Button variant="outline" size="icon" asChild className="border-border/60">
                                            <Link href="/settings">
                                                <Settings className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Tabs & Content (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="holdings" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
                            <TabsTrigger
                                value="holdings"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-base"
                            >
                                Holdings
                            </TabsTrigger>
                            <TabsTrigger
                                value="nfts"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-base"
                            >
                                NFTs
                            </TabsTrigger>
                            <TabsTrigger
                                value="activity"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-base"
                            >
                                Activity
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="holdings" className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* sBTC Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">sBTC</CardTitle>
                                        <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
                                            ₿
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{sbtcDisplay}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Bitcoin on Stacks
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Mock Token Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Stacks (STX)</CardTitle>
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stxDisplay}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Stacks Token
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="nfts">
                            {userNfts.length > 0 ? (
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                                    {userNfts.map((nftId) => (
                                        <Card key={nftId} className="overflow-hidden hover:shadow-md transition-all">
                                            <div className="aspect-square relative bg-secondary/20 p-4 flex items-center justify-center">
                                                <img
                                                    src={nftUris[nftId] || `https://api.dicebear.com/9.x/adventurer/svg?seed=${nftId}`}
                                                    alt={`Avatar #${nftId}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <CardContent className="p-3">
                                                <p className="font-semibold text-sm">Stacks Lab Avatar #{nftId}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                                    <Card className="col-span-full">
                                        <CardContent className="p-10 text-center text-muted-foreground">
                                            <div className="mx-auto bg-muted/50 rounded-full h-12 w-12 flex items-center justify-center mb-4">
                                                <Sparkles className="h-6 w-6 opacity-50" />
                                            </div>
                                            <h3 className="text-lg font-semibold mb-1">No NFTs found</h3>
                                            <p>This wallet doesn't hold any digital collectibles yet.</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="activity">
                            {recentActivity.length > 0 ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {recentActivity.map((tx) => (
                                                <div key={tx.tx_id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.tx_status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {tx.tx_status === 'success' ? <Sparkles className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{tx.tx_type}</p>
                                                            <p className="text-xs text-muted-foreground">{new Date(tx.burn_block_time_iso).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`https://explorer.hiro.so/txid/${tx.tx_id}?chain=testnet`} target="_blank">
                                                            View
                                                        </Link>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="p-10 text-center text-muted-foreground">
                                        <p>No recent activity found.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Widgets (1/3 width) */}
                <div className="space-y-6 lg:sticky lg:top-24">
                    {/* Tribute Widget */}
                    <SatTribute recipientAddress={address} recipientName={displayName} />

                    {/* Mint Widget - Only visible to owner */}
                    {user?.address && address && user.address.toUpperCase() === address.toUpperCase() && (
                        <AvatarMint />
                    )}
                </div>
            </div>
        </div >
    )
}
