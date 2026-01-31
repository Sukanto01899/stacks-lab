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
    <div className="border-t border-primary/20 bg-background/80 backdrop-blur-lg">
      <div className="container flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs md:text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">Stacks</Badge>
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', user?.isAuthenticated ? 'bg-emerald-400' : 'bg-muted-foreground/50')} />
            <span className="text-muted-foreground">{user?.isAuthenticated ? 'Connected' : 'Disconnected'}</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {user?.address ? truncateAddress(user.address) : '--'}
          </span>
          <span className="text-muted-foreground">Network: {stacksNetworkLabel}</span>
          <span className="text-muted-foreground">
            Balance: {stxLoading ? '...' : `${formatBalance(stxBalance)} STX`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={loadStxBalance} disabled={!user?.isAuthenticated || stxLoading}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={user?.isAuthenticated ? disconnectWallet : connectWallet}>
            {user?.isAuthenticated ? <Power className="mr-2 h-3 w-3" /> : <PlugZap className="mr-2 h-3 w-3" />}
            {user?.isAuthenticated ? 'Disconnect' : 'Connect'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" disabled title="Stacks network is set by NEXT_PUBLIC_STACKS_NETWORK">
            Switch Network
          </Button>
        </div>

        <div className="hidden md:block h-6 w-px bg-primary/20" />

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="border-secondary/40 bg-secondary/20 text-secondary-foreground">Bitcoin</Badge>
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', isBtcConnected ? 'bg-emerald-400' : 'bg-muted-foreground/50')} />
            <span className="text-muted-foreground">{isBtcConnected ? 'Connected' : btcStatus === 'connecting' ? 'Connecting' : 'Disconnected'}</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {btcAddress ? truncateAddress(btcAddress) : '--'}
          </span>
          <span className="text-muted-foreground">Network: {bitcoinNetworkLabel}</span>
          <span className="text-muted-foreground">
            Balance: {btcLoading ? '...' : `${formatBalance(btcBalance, 6)} ${btcSymbol}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={loadBtcBalance} disabled={!isBtcConnected || btcLoading}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={isBtcConnected ? () => disconnect({ namespace: 'bip122' }) : () => open()}>
            {isBtcConnected ? <Power className="mr-2 h-3 w-3" /> : <Bitcoin className="mr-2 h-3 w-3" />}
            {isBtcConnected ? 'Disconnect' : 'Connect'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleBitcoinSwitch} disabled={!isBtcConnected}>
            Switch Network
          </Button>
        </div>
      </div>
    </div>
  );
}
