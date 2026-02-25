"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Github,
  Lock,
  Clock,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import {
  generateSip010Contract,
  CONTRACTS,
  launchToken,
  getBitcoinBlockHeight,
} from "@/lib/contracts";
import { getUserSession } from "@/lib/stacks-client";

import { Button } from "@/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/ui/form";
import { Input } from "@/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/ui/card";
import { useLaunchpadStore } from "@/store/useLaunchpadStore";
import { Badge } from "@/ui/badge";

const toast = (msg: string) => alert(msg);

const formSchema = z.object({
  name: z
    .string()
    .min(2)
    .regex(/^[a-zA-Z0-9 ]*$/, "Alphanumeric only"),
  symbol: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[a-zA-Z0-9]*$/, "Alphanumeric only"),
  decimals: z.coerce.number().min(0).max(18),
  supply: z.coerce.number().positive(),
  uri: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  saleDurationBlocks: z.coerce.number().min(10), // ~1 day
  vestingBlocks: z.coerce.number().min(0).optional(),
  targetStx: z.coerce.number().min(100),
});

interface DeployedTokenEnv {
  principal: string;
  name: string;
  symbol: string;
}

interface SavedToken extends DeployedTokenEnv {
  createdAt: number;
  btcStartHeight?: number;
}

type DeployStep = "FORM" | "REGISTER" | "DONE";

export default function ClientLaunchpad() {
  const { user } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState<DeployStep>("FORM");
  const [deployedToken, setDeployedToken] = useState<DeployedTokenEnv | null>(
    null,
  );
  const [savedTokens, setSavedTokens] = useState<SavedToken[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [currentBtcHeight, setCurrentBtcHeight] = useState<number>(0);

  const { launchData, setLaunchData } = useLaunchpadStore();

  useEffect(() => {
    setIsMounted(true);
    // Load Saved Tokens
    try {
      const stored = localStorage.getItem("stackshub_my_tokens");
      if (stored) setSavedTokens(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load saved tokens", e);
    }

    // Fetch Bitcoin Height
    getBitcoinBlockHeight().then(setCurrentBtcHeight).catch(console.error);
  }, []);

  const saveToken = (token: DeployedTokenEnv) => {
    const newToken: SavedToken = {
      ...token,
      createdAt: Date.now(),
      btcStartHeight: currentBtcHeight,
    };
    const updated = [newToken, ...savedTokens];
    setSavedTokens(updated);
    localStorage.setItem("stackshub_my_tokens", JSON.stringify(updated));
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: launchData.name || "",
      symbol: launchData.symbol || "",
      decimals: launchData.decimals || 6,
      supply: launchData.supply || 1000000,
      uri: "",
      githubUrl: "",
      saleDurationBlocks: 144,
      vestingBlocks: 0,
      targetStx: 50000,
    },
  });

  const { watch } = form;
  watch((value) => {
    setLaunchData(value as any);
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.isAuthenticated) {
      toast("Please connect your wallet first");
      return;
    }

    setIsDeploying(true);
    // Generate the V2 Contract Code
    const code = generateSip010Contract(
      values.name,
      values.symbol,
      values.decimals,
      values.supply,
      values.uri || "https://stackslab.vercel.app/metadata.json",
    );

    import("@stacks/connect")
      .then(({ openContractDeploy }) => {
        const userSession = getUserSession();
        openContractDeploy({
          contractName: values.symbol.toLowerCase(),
          codeBody: code,
          onFinish: () => {
            const address =
              userSession.loadUserData().profile.stxAddress.testnet;
            const principal = `${address}.${values.symbol.toLowerCase()}`;

            setDeployedToken({
              principal,
              name: values.name,
              symbol: values.symbol,
            });
            setDeployStep("REGISTER");
            setIsDeploying(false);
          },
          onCancel: () => {
            setIsDeploying(false);
          },
          userSession,
        });
      })
      .catch((err) => {
        console.error("Failed to load stacks connect", err);
        setIsDeploying(false);
      });
  }

  async function handleRegister() {
    if (!deployedToken) return;

    const values = form.getValues();
    // Calculate End Height for Sale
    // We use a slight buffer or the user provided duration
    const endBurnHeight = currentBtcHeight + values.saleDurationBlocks;

    try {
      await launchToken(
        deployedToken.name,
        deployedToken.symbol,
        values.decimals,
        deployedToken.principal,
        values.githubUrl || values.uri || "",
        values.targetStx,
        endBurnHeight,
      );

      saveToken(deployedToken);
      setDeployStep("DONE");
    } catch (e) {
      console.error("Launch cancelled", e);
    }
  }

  function handleReset() {
    setDeployStep("FORM");
    setDeployedToken(null);
    setLaunchData({});
    form.reset();
  }

  if (!isMounted) return null;

  return (
    <div className="container max-w-4xl py-10 px-4 space-y-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">
              Bitcoin L2 Launchpad
            </h1>
            <Badge variant="outline" className="gap-2 px-3 py-1">
              <img
                src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg"
                className="w-4 h-4"
                alt="BTC"
              />
              Block Height:{" "}
              {currentBtcHeight > 0 ? (
                currentBtcHeight
              ) : (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Launch secure, Bitcoin-finality tokens on Stacks.
          </p>
        </div>

        {deployStep === "FORM" && (
          <Card>
            <CardHeader>
              <CardTitle>1. Define Token & Security</CardTitle>
              <CardDescription>
                Create your token with Proof-of-Code and Bitcoin time-locks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Bitcoin Pepe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. PEPE" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Supply</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="decimals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decimals</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Security & Trust
                    </h3>

                    <FormField
                      control={form.control}
                      name="githubUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proof Of Code (GitHub URL)</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center relative">
                              <Github className="w-4 h-4 absolute left-3 text-muted-foreground" />
                              <Input
                                className="pl-9"
                                placeholder="https://github.com/username/repo"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Verified builders get higher reputation scores.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="saleDurationBlocks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Duration (BTC Blocks)</FormLabel>
                          <FormControl>
                            <div className="flex gap-2 items-center relative">
                              <Clock className="w-4 h-4 absolute left-3 text-muted-foreground" />
                              <Input
                                className="pl-9"
                                type="number"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            144 blocks ≈ 24 hours
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetStx"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Graduation Target (STX)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isDeploying}
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deploying Contract...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy & Launch
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {deployStep === "REGISTER" && deployedToken && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-semibold">Contract Deployed</span>
              </div>
              <CardTitle>2. Activate on Bitcoin L2</CardTitle>
              <CardDescription>
                Register <strong>{deployedToken.symbol}</strong> to the bonding
                curve.
                <br />
                <span className="text-xs text-muted-foreground">
                  Ends at Bitcoin Block #
                  {currentBtcHeight + form.getValues().saleDurationBlocks}
                </span>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                onClick={handleRegister}
                className="w-full gap-2"
                size="lg"
              >
                Initialize Market <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {deployStep === "DONE" && deployedToken && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary mb-2">
                <Rocket className="h-6 w-6" />
                <span className="font-semibold">Launch Complete!</span>
              </div>
              <CardTitle>Trading is Live</CardTitle>
              <CardDescription>
                Your token is now tradeable on the bonding curve.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Launch Another
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/token/${deployedToken.principal}`}>
                  Trade Page <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Persistence Layer: My Launches */}
      {savedTokens.length > 0 && (
        <div className="border-t pt-10">
          <h2 className="text-xl font-bold mb-6">My Launched Tokens</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {savedTokens.map((token) => (
              <Card
                key={token.principal}
                className="overflow-hidden hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{token.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {token.symbol}
                    </Badge>
                  </div>
                  <CardDescription
                    className="font-mono text-xs truncate"
                    title={token.principal}
                  >
                    {token.principal}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  {token.btcStartHeight && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <img
                        src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg"
                        className="w-3 h-3 grayscale opacity-50"
                      />
                      From Block #{token.btcStartHeight}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/50 p-3 pt-3">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <Link href={`/token/${token.principal}`}>
                      Trade <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
