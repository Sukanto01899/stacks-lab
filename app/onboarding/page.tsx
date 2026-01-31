'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, MessageSquare, UserRound, Wallet, Sparkles } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { AvatarMint } from '@/components/profile/avatar-mint';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Badge } from '@/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CONTRACTS } from '@/lib/contracts';
import { env } from '@/lib/config';

type StepState = 'pending' | 'active' | 'complete';

const getStacksApiBase = (network: string) =>
  network === 'mainnet' ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so';

export default function OnboardingPage() {
  const { user, connectWallet } = useWallet();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [handleSaved, setHandleSaved] = useState(false);
  const [savingHandle, setSavingHandle] = useState(false);
  const [avatarCount, setAvatarCount] = useState<number | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  const stacksNetwork = env.NEXT_PUBLIC_STACKS_NETWORK ?? 'testnet';
  const apiBase = getStacksApiBase(stacksNetwork);
  const avatarsContract = stacksNetwork === 'mainnet' ? CONTRACTS.MAINNET.AVATARS : CONTRACTS.TESTNET.AVATARS;

  const isConnected = !!user?.isAuthenticated;
  const hasHandle = handleSaved && displayName.trim().length > 0;
  const hasAvatar = (avatarCount ?? 0) > 0;

  const currentStep = useMemo(() => {
    if (!isConnected) return 0;
    if (!hasHandle) return 1;
    if (!hasAvatar) return 2;
    if (!chatStarted) return 3;
    return 4;
  }, [isConnected, hasHandle, hasAvatar, chatStarted]);

  useEffect(() => {
    if (!user?.address) return;

    const loadProfile = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/users/${user.address}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.displayName) {
          setDisplayName(data.displayName);
          setHandleSaved(true);
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      }
    };

    loadProfile();
  }, [user?.address]);

  const loadAvatars = async () => {
    if (!user?.address) return;
    setAvatarLoading(true);
    try {
      const response = await fetch(`${apiBase}/extended/v1/tokens/nft/holdings?principal=${user.address}`);
      if (!response.ok) throw new Error('Failed to fetch avatar holdings');
      const data: { results: { asset_identifier: string }[] } = await response.json();
      const owned = data.results.filter((nft) => nft.asset_identifier.startsWith(avatarsContract));
      setAvatarCount(owned.length);
    } catch (error) {
      console.error('Failed to fetch avatars', error);
      setAvatarCount(null);
    } finally {
      setAvatarLoading(false);
    }
  };

  useEffect(() => {
    if (user?.address) {
      loadAvatars();
    }
  }, [user?.address, stacksNetwork]);

  const handleSave = async () => {
    if (!user?.address || !displayName.trim()) return;
    setSavingHandle(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: user.address,
          displayName: displayName.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to save handle');
      setHandleSaved(true);
      toast({ title: 'Handle saved', description: 'Your public handle is ready.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Save failed', description: 'Could not save your handle.', variant: 'destructive' });
    } finally {
      setSavingHandle(false);
    }
  };

  const steps: { title: string; description: string; state: StepState }[] = [
    {
      title: 'Connect wallet',
      description: 'Link your Stacks wallet to unlock profiles and minting.',
      state: isConnected ? 'complete' : currentStep === 0 ? 'active' : 'pending',
    },
    {
      title: 'Set handle',
      description: 'Pick a public name for your profile.',
      state: hasHandle ? 'complete' : currentStep === 1 ? 'active' : 'pending',
    },
    {
      title: 'Mint avatar',
      description: 'Claim your limited edition Stacks Lab avatar.',
      state: hasAvatar ? 'complete' : currentStep === 2 ? 'active' : 'pending',
    },
    {
      title: 'Join chat',
      description: 'Start a secure conversation on Stacks.',
      state: chatStarted ? 'complete' : currentStep === 3 ? 'active' : 'pending',
    },
  ];

  return (
    <div className="container px-4 py-12 md:py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="space-y-3">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">Guided Setup</Badge>
          <h1 className="text-3xl md:text-4xl font-bold">Welcome to Stacks Lab</h1>
          <p className="text-muted-foreground max-w-2xl">
            Complete these steps to unlock your profile, mint your avatar, and jump into encrypted chat.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-primary/20 bg-card/70">
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Follow the guided steps to get fully set up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps.map((step, idx) => (
                <div key={step.title} className="flex gap-4">
                  <div className="mt-0.5">
                    {step.state === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className={`h-5 w-5 ${step.state === 'active' ? 'text-primary' : 'text-muted-foreground/40'}`} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{idx + 1}. {step.title}</span>
                      {step.state === 'active' && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] border-primary/30 text-primary">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-4 w-4 text-primary" />
                  Connect wallet
                </CardTitle>
                <CardDescription>Link your Stacks wallet to continue.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Status: {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <Button onClick={connectWallet} disabled={isConnected} size="sm">
                  {isConnected ? 'Connected' : 'Connect'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserRound className="h-4 w-4 text-primary" />
                  Set handle
                </CardTitle>
                <CardDescription>Pick a public handle (display name).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle</Label>
                  <Input
                    id="handle"
                    placeholder="satstacker"
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value);
                      if (handleSaved) setHandleSaved(false);
                    }}
                    disabled={!isConnected}
                  />
                </div>
                <Button onClick={handleSave} disabled={!isConnected || !displayName.trim() || savingHandle} size="sm">
                  {savingHandle && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  {hasHandle ? 'Saved' : 'Save handle'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Mint avatar
                </CardTitle>
                <CardDescription>Claim your Stacks Lab collectible.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Owned avatars: {avatarLoading ? '...' : avatarCount ?? '--'}</span>
                  <Button size="sm" variant="ghost" onClick={loadAvatars} disabled={!isConnected || avatarLoading}>
                    Refresh
                  </Button>
                </div>
                <AvatarMint />
                {hasAvatar && (
                  <div className="text-xs text-emerald-400">Avatar minted. You are good to go.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Join chat
                </CardTitle>
                <CardDescription>Start an encrypted conversation.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Status: {chatStarted ? 'Entered' : 'Not started'}
                </div>
                <Button asChild size="sm" onClick={() => setChatStarted(true)} disabled={!isConnected}>
                  <Link href="/chat">Enter chat</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
