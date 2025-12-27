'use client';

import { useState } from 'react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Loader2, Send } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { sendSbtcTransfer } from '@/lib/sbtc';
import { useToast } from '@/hooks/use-toast';

interface SatTributeProps {
    recipientAddress: string;
    recipientName?: string;
}

export function SatTribute({ recipientAddress, recipientName }: SatTributeProps) {
    const { user } = useWallet();
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>('1000'); // Default 1000 sats
    const [memo, setMemo] = useState<string>('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!user?.isAuthenticated) return;

        const sats = parseInt(amount);
        if (isNaN(sats) || sats <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid amount of Satoshis.",
                variant: "destructive"
            });
            return;
        }

        setIsSending(true);
        try {
            await sendSbtcTransfer({
                amount: sats,
                recipient: recipientAddress,
                memo: memo,
                networkType: 'testnet' // Default to testnet for dev
            });

            toast({
                title: "Transfer Initiated",
                description: `Sending ${sats} sats to ${recipientName || recipientAddress}`,
            });
            setAmount('');
            setMemo('');
        } catch (error) {
            console.error(error);
            toast({
                title: "Transfer Failed",
                description: "The transaction was cancelled or failed.",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="glass-card border-orange-500/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
                        ₿
                    </div>
                    Sat Tribute
                </CardTitle>
                <CardDescription>
                    Send sBTC to {recipientName || 'this user'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount (Satoshis)</Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground">
                        1 sBTC = 100,000,000 Sats
                    </p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="memo">Memo (Optional)</Label>
                    <Input
                        id="memo"
                        placeholder="Great content!"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        maxLength={34}
                        className="bg-background/50"
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/20"
                    onClick={handleSend}
                    disabled={isSending || !user?.isAuthenticated}
                >
                    {isSending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Tribute
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
