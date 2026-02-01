'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bitcoin, RefreshCw, Power, PlugZap } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { getStxBalance, truncateAddress } from '@/lib/stacks';
import { env } from '@/lib/config';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { cn } from '@/lib/utils';
import { useAppKit, useAppKitAccount, useAppKitBalance, useAppKitNetwork, useDisconnect } from '@reown/appkit/react';
import { bitcoin, bitcoinTestnet } from '@reown/appkit/networks';

const microToStx = (microStx: number) => microStx / 1_000_000;

const formatBalance = (value: number | null, decimals = 4) => {
  if (value === null || Number.isNaN(value)) return '--';
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
};

const getStacksNetworkLabel = (network: string) => {
  if (network === 'mainnet') return 'Mainnet';
  if (network === 'devnet') return 'Devnet';
  return 'Testnet';
};

export function UnifiedWalletStatus() {
  const { user, connectWallet, disconnectWallet } = useWallet();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { address: btcAddress, isConnected: isBtcConnected, status: btcStatus } = useAppKitAccount({ namespace: 'bip122' });
  const { caipNetwork, caipNetworkId, switchNetwork } = useAppKitNetwork();
  const { fetchBalance } = useAppKitBalance();

  const [stxBalance, setStxBalance] = useState<number | null>(null);
  const [stxLoading, setStxLoading] = useState(false);
  const [btcBalance, setBtcBalance] = useState<number | null>(null);
  const [btcSymbol, setBtcSymbol] = useState<string>('BTC');
  const [btcLoading, setBtcLoading] = useState(false);

  const stacksNetwork = env.NEXT_PUBLIC_STACKS_NETWORK ?? 'testnet';
  const stacksNetworkLabel = getStacksNetworkLabel(stacksNetwork);

  const isBitcoinTestnet = useMemo(() => {
    const id = `${caipNetworkId ?? ''}`.toLowerCase();
    const name = `${caipNetwork?.name ?? ''}`.toLowerCase();
    return id.includes('testnet') || name.includes('testnet');
  }, [caipNetworkId, caipNetwork?.name]);

  const bitcoinNetworkLabel = isBtcConnected ? (isBitcoinTestnet ? 'Testnet' : 'Mainnet') : '--';

  const loadStxBalance = async () => {
    if (!user?.address) return;
    setStxLoading(true);
    try {
      const networkType = stacksNetwork === 'mainnet' ? 'mainnet' : 'testnet';
      const balance = await getStxBalance(user.address, networkType);
      setStxBalance(microToStx(balance));
    } finally {
      setStxLoading(false);
    }
  };

  const loadBtcBalance = async () => {
    if (!isBtcConnected) return;
    setBtcLoading(true);
    try {
      const result = await fetchBalance();
      const raw = Number(result.data?.balance ?? 0);
      setBtcBalance(Number.isFinite(raw) ? raw : null);
      if (result.data?.symbol) {
        setBtcSymbol(result.data.symbol);
      }
    } finally {
      setBtcLoading(false);
    }
  };

  useEffect(() => {
    if (user?.isAuthenticated) {
      loadStxBalance();
    } else {
      setStxBalance(null);
    }
  }, [user?.address, user?.isAuthenticated, stacksNetwork]);

  useEffect(() => {
    if (isBtcConnected) {
      loadBtcBalance();
    } else {
      setBtcBalance(null);
      setBtcSymbol('BTC');
    }
  }, [isBtcConnected, caipNetworkId, btcAddress]);

  const handleBitcoinSwitch = async () => {
    const target = isBitcoinTestnet ? bitcoin : bitcoinTestnet;
    await switchNetwork(target);
  };

  return (
    <div className="border-t border-primary/30 bg-[radial-gradient(circle_at_10%_20%,rgba(0,255,255,0.18),transparent_55%),radial-gradient(circle_at_90%_0%,rgba(255,0,204,0.16),transparent_45%),radial-gradient(circle_at_50%_120%,rgba(255,170,0,0.12),transparent_55%)] backdrop-blur-xl">
      <div className="container relative px-4 py-3">
        <div className="absolute inset-0 pointer-events-none retro-grid opacity-20" />
        <div className="absolute -top-8 right-12 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-6 left-12 h-24 w-24 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative grid gap-3 lg:grid-cols-[1fr_auto_1fr] items-center text-xs md:text-sm">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cyan-400/30 bg-black/40 px-3 py-2 shadow-[0_0_24px_rgba(0,255,255,0.15)]">
            <Badge variant="outline" className="border-cyan-400/60 bg-cyan-400/10 text-cyan-200">Stacks</Badge>
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,255,200,0.7)]', user?.isAuthenticated ? 'bg-emerald-400' : 'bg-muted-foreground/50')} />
              <span className="text-cyan-100/80">{user?.isAuthenticated ? 'Connected' : 'Disconnected'}</span>
            </div>
            <span className="font-mono text-[11px] text-cyan-100/60">
              {user?.address ? truncateAddress(user.address) : '--'}
            </span>
            <span className="text-cyan-100/60">Network: {stacksNetworkLabel}</span>
            <span className="text-cyan-100/80">
              Balance: {stxLoading ? '...' : `${formatBalance(stxBalance)} STX`}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-black/30 px-3 py-2 shadow-[0_0_18px_rgba(255,0,204,0.12)]">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-cyan-100 hover:text-cyan-50 hover:bg-cyan-400/10" onClick={loadStxBalance} disabled={!user?.isAuthenticated || stxLoading}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 border-cyan-400/40 text-cyan-100 hover:bg-cyan-400/10" onClick={user?.isAuthenticated ? disconnectWallet : connectWallet}>
              {user?.isAuthenticated ? <Power className="mr-2 h-3 w-3" /> : <PlugZap className="mr-2 h-3 w-3" />}
              {user?.isAuthenticated ? 'Disconnect' : 'Connect'}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-fuchsia-200/80 hover:text-fuchsia-100 hover:bg-fuchsia-500/10" disabled title="Stacks network is set by NEXT_PUBLIC_STACKS_NETWORK">
              Switch Network
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-fuchsia-500/30 bg-black/40 px-3 py-2 shadow-[0_0_24px_rgba(255,0,204,0.15)]">
            <Badge variant="outline" className="border-fuchsia-500/60 bg-fuchsia-500/10 text-fuchsia-200">Bitcoin</Badge>
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shadow-[0_0_8px_rgba(255,170,0,0.7)]', isBtcConnected ? 'bg-amber-300' : 'bg-muted-foreground/50')} />
              <span className="text-fuchsia-100/80">{isBtcConnected ? 'Connected' : btcStatus === 'connecting' ? 'Connecting' : 'Disconnected'}</span>
            </div>
            <span className="font-mono text-[11px] text-fuchsia-100/60">
              {btcAddress ? truncateAddress(btcAddress) : '--'}
            </span>
            <span className="text-fuchsia-100/60">Network: {bitcoinNetworkLabel}</span>
            <span className="text-fuchsia-100/80">
              Balance: {btcLoading ? '...' : `${formatBalance(btcBalance, 6)} ${btcSymbol}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-black/30 px-3 py-2 shadow-[0_0_18px_rgba(255,170,0,0.12)] lg:col-start-3">
            <Button size="sm" variant="ghost" className="h-7 px-2 text-fuchsia-100 hover:text-fuchsia-50 hover:bg-fuchsia-500/10" onClick={loadBtcBalance} disabled={!isBtcConnected || btcLoading}>
              <RefreshCw className="mr-2 h-3 w-3" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 border-fuchsia-500/40 text-fuchsia-100 hover:bg-fuchsia-500/10" onClick={isBtcConnected ? () => disconnect({ namespace: 'bip122' }) : () => open()}>
              {isBtcConnected ? <Power className="mr-2 h-3 w-3" /> : <Bitcoin className="mr-2 h-3 w-3" />}
              {isBtcConnected ? 'Disconnect' : 'Connect'}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/10" onClick={handleBitcoinSwitch} disabled={!isBtcConnected}>
              Switch Network
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
