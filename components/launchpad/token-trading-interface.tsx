'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { useWallet } from '@/hooks/useWallet';
import { CONTRACTS, getBitcoinBlockHeight, claimVestedTokens } from '@/lib/contracts';
import { readContract } from '@/lib/stacks';
import { contractPrincipalCV, uintCV, principalCV } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { getUserSession } from '@/lib/stacks-client';
import { Loader2, TrendingUp, Clock, Lock } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Progress } from '@/ui/progress';

interface TokenState {
    creator: string;
    supply: number;
    stxReserve: number;
    active: boolean;
    targetSupply: number;
    endBurnHeight: number;
    metadataUrl?: string;
}

interface VestingSchedule {
    total: number;
    claimed: number;
    start: number;
    end: number;
}

interface TokenTradingInterfaceProps {
    tokenPrincipal: string; // e.g. ST123...token-name
}

export function TokenTradingInterface({ tokenPrincipal }: TokenTradingInterfaceProps) {
    const { user } = useWallet();
    const [tokenState, setTokenState] = useState<TokenState | null>(null);
    const [vesting, setVesting] = useState<VestingSchedule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [isTrading, setIsTrading] = useState(false);
    const [btcHeight, setBtcHeight] = useState(0);

    // Parse principal
    const [contractAddress, contractName] = tokenPrincipal.split('.');

    // Fetch Token Data
    const fetchData = async () => {
        try {
            const [launchpadAddress, launchpadName] = CONTRACTS.TESTNET.LAUNCHPAD.split('.');

            // 1. Get Bitcoin Height
            const height = await getBitcoinBlockHeight();
            setBtcHeight(height);

            // 2. Call get-token-details on Launchpad
            const data = await readContract(
                launchpadAddress,
                launchpadName,
                'get-token-details',
                [contractPrincipalCV(contractAddress, contractName)],
                'testnet'
            );

            if (data && data.value) {
                const details = data.value.value;
                setTokenState({
                    creator: details.creator.value,
                    supply: parseInt(details.supply.value),
                    stxReserve: parseInt(details['stx-reserve'].value),
                    active: details.active.value,
                    targetSupply: parseInt(details['target-supply'].value),
                    endBurnHeight: parseInt(details['end-burn-height'].value),
                    metadataUrl: details['metadata-url']?.value
                });
            }

            // 3. Check Vesting if user connected
            if (user?.isAuthenticated) {
                const vData = await readContract(
                    launchpadAddress,
                    launchpadName,
                    'get-vesting-schedule',
                    [
                        contractPrincipalCV(contractAddress, contractName),
                        principalCV(user.stxAddress) // User address
                    ],
                    'testnet'
                );

                if (vData && vData.value) {
                    const v = vData.value.value;
                    setVesting({
                        total: parseInt(v['total-amount'].value),
                        claimed: parseInt(v['claimed-amount'].value),
                        start: parseInt(v['start-burn-height'].value),
                        end: parseInt(v['end-burn-height'].value),
                    });
                }
            }

        } catch (e) {
            console.error("Failed to fetch token data", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, [tokenPrincipal, user?.isAuthenticated]);

    const handleBuy = async () => {
        if (!amount || isNaN(Number(amount))) return;
        setIsTrading(true);
        const stxAmount = Math.floor(Number(amount) * 1000000);

        const [launchpadAddress, launchpadName] = CONTRACTS.TESTNET.LAUNCHPAD.split('.');

        openContractCall({
            contractAddress: launchpadAddress,
            contractName: launchpadName,
            functionName: 'buy',
            functionArgs: [
                contractPrincipalCV(contractAddress, contractName),
                uintCV(stxAmount)
            ],
            network: undefined,
            userSession: getUserSession(),
            onFinish: () => {
                setIsTrading(false);
                setAmount('');
                fetchData();
            },
            onCancel: () => setIsTrading(false)
        });
    };

    const handleSell = async () => {
        if (!amount || isNaN(Number(amount))) return;
        setIsTrading(true);
        const tokenAmount = Math.floor(Number(amount));

        const [launchpadAddress, launchpadName] = CONTRACTS.TESTNET.LAUNCHPAD.split('.');

        openContractCall({
            contractAddress: launchpadAddress,
            contractName: launchpadName,
            functionName: 'sell',
            functionArgs: [
                contractPrincipalCV(contractAddress, contractName),
                uintCV(tokenAmount)
            ],
            network: undefined,
            userSession: getUserSession(),
            onFinish: () => {
                setIsTrading(false);
                setAmount('');
                fetchData();
            },
            onCancel: () => setIsTrading(false)
        });
    };

    const handleClaimVesting = async () => {
        setIsTrading(true);
        try {
            await claimVestedTokens(tokenPrincipal, 'testnet');
            // Optimistic UI update or refresh
        } catch (e) {
            console.error(e);
        } finally {
            setIsTrading(false);
        }
    }

    // Calculations
    const currentPriceInUstx = tokenState ? (1000 + (tokenState.supply / 1000)) : 1000;
    const currentPriceStx = currentPriceInUstx / 1000000;

    if (isLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (!tokenState) {
        return <div className="p-10 text-center">Token not found or not registered.</div>;
    }

    const progress = Math.min((tokenState.supply / tokenState.targetSupply) * 100, 100);
    const blocksRemaining = Math.max(0, tokenState.endBurnHeight - btcHeight);
    const hoursRemaining = (blocksRemaining * 10) / 60; // Approx 10min blocks

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Left Column: Stats & Chart */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {contractName} <Badge variant="secondary">{contractAddress.slice(0, 6)}</Badge>
                                    {tokenState.metadataUrl && tokenState.metadataUrl.includes('github') && (
                                        <a href={tokenState.metadataUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 6 3 5.5 2.5 5.5c-1.5 0-2.5-.5-3.5-1.5-.4-.4-.8-.9-1-1.5-.7-.2-1.4-.4-1.9-.5-1-.2-1.3-.9-1.9-1.3-.4.3-.9.9-1.4 1.4-.5.5-.8 1.1-.8 1.9v2.6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-4a6 6 0 0 1 1-6.6l.8-.7c.3-.3.8-.4 1.2-.4h.1c.3 0 .7.1 1 .4l.8.7a8 8 0 0 0 2 0c.3-.3.7-.4 1-.4h.1c.4 0 .9.1 1.2.4l.8.7a6 6 0 0 1 1 6.6v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" /><path d="M9 9h6" /></svg>
                                        </a>
                                    )}
                                </CardTitle>
                                <CardDescription>Created by {tokenState.creator}</CardDescription>
                            </div>
                            <div className="text-right">
                                <Badge variant={blocksRemaining > 0 ? "default" : "destructive"} className="flex gap-1 items-center">
                                    <Clock className="w-3 h-3" />
                                    {blocksRemaining > 0 ? `${blocksRemaining} Blocks Left` : "Sale Ended"}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Target Block: #{tokenState.endBurnHeight}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Price</div>
                            <div className="text-xl font-bold">{currentPriceStx.toFixed(6)} STX</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Market Cap</div>
                            <div className="text-xl font-bold">{(currentPriceStx * tokenState.supply).toLocaleString()} STX</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Supply</div>
                            <div className="text-xl font-bold">{tokenState.supply.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Reserve</div>
                            <div className="text-xl font-bold">{(tokenState.stxReserve / 1000000).toLocaleString()} STX</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bonding Curve Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Bonding Curve Progress
                        </CardTitle>
                        <CardDescription>
                            Funds are secured by Bitcoin finality. Graduation triggers liquidity lock.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Progress value={progress} className="h-4" />
                        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                            <span>{progress.toFixed(2)}% Complete</span>
                            <span>Target: {tokenState.targetSupply.toLocaleString()} Tokens</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Vesting Panel (If exists) */}
                {vesting && (
                    <Card className="border-indigo-500/20 bg-indigo-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-600">
                                <Lock className="h-5 w-5" /> Your Vested Allocation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span>Claimed: {vesting.claimed}</span>
                                    <span>Total: {vesting.total}</span>
                                </div>
                                <Progress value={(vesting.claimed / vesting.total) * 100} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                    Unlocks from Block #{vesting.start} to #{vesting.end}
                                </div>
                                <Button size="sm" onClick={handleClaimVesting} disabled={isTrading}>
                                    {isTrading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Claim Available Tokens"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Right Column: Trade Form */}
            <div>
                <Card className="h-full border-primary/20">
                    <CardHeader>
                        <CardTitle>Trade {tokenState.active ? "" : "(Graduated)"}</CardTitle>
                        <CardDescription>Swap STX for {contractName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="buy" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Buy</TabsTrigger>
                                <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Sell</TabsTrigger>
                            </TabsList>
                            <TabsContent value="buy" className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount (STX)</label>
                                    <Input
                                        type="number"
                                        placeholder="0.0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={!tokenState.active}
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Est. Tokens: {amount ? (Number(amount) / currentPriceStx).toFixed(2) : '0.00'}
                                </div>
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleBuy} disabled={isTrading || !tokenState.active}>
                                    {isTrading ? <Loader2 className="animate-spin" /> : "Buy Tokens"}
                                </Button>
                                {!tokenState.active && <p className="text-xs text-red-500 text-center">Trading halted (Graduated)</p>}
                            </TabsContent>
                            <TabsContent value="sell" className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount ({contractName})</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        disabled={!tokenState.active}
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Est. STX: {amount ? (Number(amount) * currentPriceStx).toFixed(6) : '0.00'}
                                </div>
                                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleSell} disabled={isTrading || !tokenState.active}>
                                    {isTrading ? <Loader2 className="animate-spin" /> : "Sell Tokens"}
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
