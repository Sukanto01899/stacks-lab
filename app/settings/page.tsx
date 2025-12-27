'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Wallet, Image as ImageIcon } from 'lucide-react';
import { CONTRACTS } from '@/lib/contracts';
import { Badge } from '@/ui/badge';
import { env } from '@/lib/config';

interface NFT {
    asset_identifier: string;
    value: {
        repr: string;
        hex: string;
    };
}

export default function SettingsPage() {
    const { user } = useWallet();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    // Avatars State
    const [myAvatars, setMyAvatars] = useState<NFT[]>([]);
    const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.address || ''); // Default
            fetchMyAvatars();
            fetchUserProfile(); // Fetch real profile
        }
    }, [user]);

    const fetchUserProfile = async () => {
        if (!user?.address) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/users/${user.address}`);
            if (res.ok) {
                const data = await res.json();
                if (data.displayName) setDisplayName(data.displayName);
                if (data.bio) setBio(data.bio);
                // We could sync avatarUrl to store here too if we had access to setUser, 
                // but useWallet only gives us user.
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    };

    const fetchMyAvatars = async () => {
        if (!user?.address) return;

        setIsLoadingAvatars(true);
        try {
            const address = user.address;
            const apiBase = env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
                ? 'https://api.mainnet.hiro.so'
                : 'https://api.testnet.hiro.so';

            const response = await fetch(`${apiBase}/extended/v1/tokens/nft/holdings?principal=${address}`);
            const data: { results: NFT[] } = await response.json();

            // Filter for our contract
            const ourContractId = CONTRACTS.TESTNET.AVATARS;
            const avatars = data.results.filter((nft) => nft.asset_identifier.startsWith(ourContractId));

            setMyAvatars(avatars);
        } catch (error) {
            console.error("Failed to fetch avatars:", error);
        } finally {
            setIsLoadingAvatars(false);
        }
    };

    const handleSetPfp = async (nft: NFT) => {
        if (!user?.address) return;
        const avatarUrl = `/avatars/${nft.value.repr.replace('u', '')}.svg`;

        // Update via API
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: user.address,
                    avatarUrl
                })
            });

            toast({
                title: "Avatar Updated",
                description: "Your profile picture has been updated.",
            });

            // Force reload or update store (ideally)
            // window.location.reload(); // Simple way to refresh app state for now
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update avatar.",
                variant: 'destructive'
            });
        }
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: user?.address,
                    displayName,
                    bio
                })
            });

            toast({
                title: "Profile Updated",
                description: "Your profile settings have been saved.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save profile.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user?.isAuthenticated) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Connect Wallet</h1>
                <p className="text-muted-foreground">Please connect your wallet to access settings.</p>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="avatars" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> My Avatars
                    </TabsTrigger>
                    <TabsTrigger value="wallet" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Wallet
                    </TabsTrigger>
                </TabsList>

                {/* Profile Settings */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your public profile details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your display name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Input
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself"
                                />
                            </div>

                            <Button onClick={handleSaveProfile} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Avatars */}
                <TabsContent value="avatars">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Avatars</CardTitle>
                            <CardDescription>Manage your Stacks Lab Avatars.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAvatars ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : myAvatars.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {myAvatars.map((nft, i) => (
                                        <div key={i} className="border rounded-lg p-2 text-center space-y-2">
                                            <div className="aspect-square bg-secondary rounded-md overflow-hidden relative">
                                                <Image
                                                    src={`/avatars/${nft.value.repr.replace('u', '')}.svg`}
                                                    alt={`Avatar ${nft.value.repr}`}
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        // Fallback logic for Images handles differently in next/image, usually requires state
                                                        // We will use a trusted placeholder if local fails, or just let it be
                                                        const target = e.target as HTMLImageElement;
                                                        target.srcset = `https://api.dicebear.com/9.x/adventurer/svg?seed=${nft.value.repr}`;
                                                    }}
                                                />
                                            </div>
                                            <p className="font-mono text-sm">#{nft.value.repr.replace('u', '')}</p>
                                            <Button size="sm" variant="outline" className="w-full" onClick={() => handleSetPfp(nft)}>Set as PFP</Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>You don&apos;t own any Stacks Lab Avatars yet.</p>
                                    <Button variant="link" asChild className="mt-2">
                                        <a href={`/profile/${user?.address}`}>Go to Profile to Mint</a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Wallet */}
                <TabsContent value="wallet">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Wallet</CardTitle>
                            <CardDescription>Manage your wallet connection.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-secondary/50 rounded-lg flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Testnet Address</p>
                                    <p className="font-mono text-xs text-muted-foreground">{user?.address}</p>
                                </div>
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>
                            </div>

                            <div className="p-4 bg-secondary/50 rounded-lg flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Mainnet Address</p>
                                    <p className="font-mono text-xs text-muted-foreground">{user?.address}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
