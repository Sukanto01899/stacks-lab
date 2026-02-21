"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Loader2, Zap } from "lucide-react";
import { mintAvatar, CONTRACTS } from "@/lib/contracts";
import { useWallet } from "@/hooks/useWallet";
import { uintCV, cvToJSON } from "@stacks/transactions";
import { env } from "@/lib/config";
import { getStxBalance } from "@/lib/stacks";
import { useToast } from "@/hooks/use-toast";

// Mock list of 100 avatars (In production, we would fetch metadata)
// For now, we assume standard naming 1.svg ... 100.svg
const AVATARS = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Stacks Lab Avatar #${i + 1}`,
  image: `/avatars/${i + 1}.svg`,
}));

export function Marketplace() {
  const { user } = useWallet();
  const [mintingId, setMintingId] = useState<number | null>(null);
  const [lastTokenId, setLastTokenId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContractState();
  }, []);

  const fetchContractState = async () => {
    try {
      const contractAddress =
        env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
          ? CONTRACTS.MAINNET.AVATARS
          : CONTRACTS.TESTNET.AVATARS;
      console.log("[Marketplace] Fetching state from:", contractAddress);
      const [address, name] = contractAddress.split(".");

      // Direct API call to bypass library version conflict
      const apiUrl =
        env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
          ? "https://api.mainnet.hiro.so"
          : "https://api.testnet.hiro.so";

      const response = await fetch(
        `${apiUrl}/v2/contracts/call-read/${address}/${name}/get-last-token-id`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: address,
            arguments: [],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("[Marketplace] API Data:", data);

      if (data.okay && data.result) {
        const { deserializeCV } = await import("@stacks/transactions");
        const resultCV = deserializeCV(data.result);
        const json = cvToJSON(resultCV);
        console.log("[Marketplace] Parsed JSON:", json);

        if (json.value) {
          const id = parseInt(json.value.value);
          console.log("[Marketplace] Last Token ID parsed:", id);
          if (!isNaN(id)) {
            setLastTokenId(id);
          }
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch contract state", e);
      toast({
        title: "Error Fetching Data",
        description: e.message || "Failed to connect to Stacks node",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { toast } = useToast();

  const handleMint = async (id: number) => {
    if (!user) return;

    try {
      const balance = await getStxBalance(
        user.address,
        env.NEXT_PUBLIC_STACKS_NETWORK as any,
      );
      if (balance < 100000000) {
        toast({
          title: "Insufficient Balance",
          description: "You need 100 STX to mint an avatar",
          variant: "destructive",
        });
        return;
      }

      setMintingId(id);
      const uri = `https://api.dicebear.com/9.x/adventurer/svg?seed=Stacks Lab-${id}`;
      await mintAvatar(uri, env.NEXT_PUBLIC_STACKS_NETWORK as any);
      toast({
        title: "Mint Transaction Sent",
        description: "Your transaction has been broadcast to the network.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Mint Failed",
        description: "Transaction was cancelled or failed.",
        variant: "destructive",
      });
    } finally {
      setMintingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Supply
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Minted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{lastTokenId}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{100 - lastTokenId}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100 STX</div>
          </CardContent>
        </Card>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {AVATARS.map((avatar) => {
          const isMinted = avatar.id <= lastTokenId;
          const isNext = avatar.id === lastTokenId + 1;

          return (
            <Card
              key={avatar.id}
              className={`overflow-hidden transition-all hover:shadow-md ${isMinted ? "opacity-75 bg-muted/50" : ""}`}
            >
              <div className="aspect-square relative bg-secondary/20 p-4 flex items-center justify-center">
                <img
                  src={`/avatars/${avatar.id}.svg`}
                  alt={avatar.name}
                  className="w-full h-full object-contain transition-transform hover:scale-105"
                  loading="lazy"
                />
                {isMinted && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary">Owned</Badge>
                  </div>
                )}
              </div>
              <CardFooter className="p-3">
                {isMinted ? (
                  <Button variant="ghost" className="w-full" disabled>
                    Sold Out
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!isNext || mintingId !== null}
                    onClick={() => handleMint(avatar.id)}
                  >
                    {mintingId === avatar.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        {isNext ? "Mint (100 STX)" : "Locked"}
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
