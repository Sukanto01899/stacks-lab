# Stacks Lab Frontend Audit & Roadmap

## 🔍 Current State Analysis

### ✅ What's Working (Real Implementation)
1. **NFT Marketplace** - Fully functional
   - Real contract integration with `stacks-hub-avatars-v9`
   - Sequential minting (only next ID can be minted)
   - Live stats from blockchain
   - Balance checking before mint

2. **Profile Page** - Mostly real
   - Real STX balance fetching
   - Real sBTC balance integration
   - Real NFT holdings from Hiro API
   - Real transaction activity
   - Reputation contract integration

3. **Chat System** - Backend ready
   - WebSocket infrastructure (Socket.IO + Redis)
   - Database schema for conversations, messages, participants
   - E2EE handshake system
   - Message persistence

4. **Launchpad Contracts** - Clarity 4 ready
   - Bonding curve implementation
   - Bitcoin finality integration
   - Vesting schedules
   - Reputation rewards
   - Liquidity locking

---

## ❌ Mock Data to Remove

### 1. **Marketplace Grid** (`components/marketplace/marketplace-grid.tsx`)
```typescript
// Line 15-21: Mock avatar list
const AVATARS = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Stacks Lab Avatar #${i + 1}`,
    image: `/avatars/${i + 1}.svg`
}));
```
**Fix**: This is actually fine - it's just UI generation. The real data comes from contract state.

### 2. **Profile Page** (`app/profile/[handle]/page.tsx`)
```typescript
// Line 276: Comment says "Mock Token Card"
// But it's actually showing real STX balance
```
**Fix**: Remove the misleading comment. The implementation is real.

### 3. **Backend sBTC Service** (`backend/src/services/sbtc.ts`)
```typescript
// Line 53: Returns empty list for FT events
// "For now, we'll return a mock or empty list"
```
**Fix**: Implement proper Hiro API FT event fetching.

---

## 🏗️ Contracts Needed (Clarity 4)

### ✅ Already Have:
1. ✅ `launchpad-v9.clar` - Bonding curve token launcher
2. ✅ `stacks-hub-avatars-v9.clar` - NFT collection
3. ✅ `marketplace-v9.clar` - NFT marketplace
4. ✅ `reputation-v9.clar` - Reputation system
5. ✅ `liquidity-locker-v9.clar` - Liquidity locking
6. ✅ `sip009-nft-trait-v9.clar` - NFT trait
7. ✅ `sip010-ft-trait-v9.clar` - FT trait (v9)

### 🆕 Contracts to Add:

#### 1. **Chat Escrow Contract** (Optional but recommended)
```clarity
;; chat-escrow.clar
;; Escrow STX/sBTC for paid chat requests
;; - Lock funds when sending chat request
;; - Release to recipient when accepted
;; - Refund sender if declined/expired
```

#### 2. **Governance Contract** (For DAO features)
```clarity
;; governance.clar
;; - Proposal creation (requires reputation)
;; - Voting with STX/reputation weight
;; - Execution of passed proposals
```

#### 3. **Staking Contract** (For STX/token staking)
```clarity
;; staking.clar
;; - Stake STX to earn reputation
;; - Stake launched tokens for rewards
;; - Time-locked staking tiers
```

---

## 🔌 Reown (WalletConnect) Integration Plan

### Current State:
- Only Stacks Connect (Hiro/Leather wallet)
- No Bitcoin wallet support

### Integration Steps:

#### 1. Install Reown AppKit
```bash
npm install @reown/appkit @reown/appkit-adapter-wagmi wagmi viem @tanstack/react-query
```

#### 2. Create Wallet Provider (`lib/wallet-provider.tsx`)
```typescript
'use client';

import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StacksProvider } from '@stacks/connect-react'

// Configure for both Bitcoin and Stacks
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!

const metadata = {
  name: 'Stacks Lab',
  description: 'The Bitcoin Superapp',
  url: 'https://stackslab.vercel.app',
  icons: ['https://stackslab.vercel.app/logo.svg']
}

// Create modal
createAppKit({
  adapters: [/* Bitcoin, Stacks adapters */],
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})

export function WalletProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <StacksProvider>
          {children}
        </StacksProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

#### 3. Dual Connection UI
```typescript
// components/connect-wallet-button.tsx
export function ConnectWalletButton() {
  const [walletType, setWalletType] = useState<'stacks' | 'bitcoin'>('stacks')
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Connect Wallet</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => connectStacks()}>
          Stacks Wallet (Hiro/Leather)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => connectBitcoin()}>
          Bitcoin Wallet (Reown)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

#### 4. Unified User Store
```typescript
// store/useWalletStore.ts
interface WalletState {
  stacksAddress: string | null
  bitcoinAddress: string | null
  walletType: 'stacks' | 'bitcoin' | 'both'
  // ... rest
}
```

---

## 🎯 Priority Fixes (Frontend Only)

### High Priority:
1. ✅ Remove backend dependency for now
2. ✅ Fix all mock data references
3. 🔄 Add Reown integration for Bitcoin wallets
4. 🔄 Implement proper error boundaries
5. 🔄 Add loading states for all async operations

### Medium Priority:
1. 🔄 Implement client-side caching (React Query)
2. 🔄 Add optimistic updates for better UX
3. 🔄 Implement proper form validation
4. 🔄 Add toast notifications for all actions

### Low Priority:
1. 🔄 Add animations/transitions
2. 🔄 Implement dark/light mode toggle
3. 🔄 Add keyboard shortcuts
4. 🔄 Improve mobile responsiveness

---

## 📝 Next Steps

### Phase 1: Clean Up (1-2 days)
- [ ] Remove all mock data comments
- [ ] Add proper TypeScript types everywhere
- [ ] Fix all linting errors
- [ ] Add error boundaries

### Phase 2: Reown Integration (2-3 days)
- [ ] Set up Reown project
- [ ] Install dependencies
- [ ] Create wallet provider
- [ ] Update UI for dual wallet support
- [ ] Test Bitcoin wallet connection

### Phase 3: Contract Deployment (1-2 days)
- [ ] Deploy all contracts to testnet
- [ ] Update contract addresses in config
- [ ] Test all contract interactions
- [ ] Add contract ABIs to repo

### Phase 4: Polish (2-3 days)
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Add success/error toasts
- [ ] Test all user flows
- [ ] Fix any remaining bugs

---

## 🔐 Security Considerations

1. **Post Conditions**: All contract calls have proper post-conditions
2. **Input Validation**: Add client-side validation before contract calls
3. **Error Handling**: Never expose sensitive errors to users
4. **Rate Limiting**: Add rate limiting for API calls
5. **Wallet Security**: Never store private keys, use secure session management

---

## 📊 Contract Deployment Checklist

- [ ] `sip010-ft-trait-v9.clar` (Already deployed: ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT.sip010-ft-trait-v9)
- [ ] `stacks-hub-avatars-v9.clar` (Already deployed)
- [ ] `launchpad-v9.clar` (Need to deploy)
- [ ] `marketplace-v9.clar` (Need to deploy)
- [ ] `reputation-v9.clar` (Need to deploy)
- [ ] `liquidity-locker-v9.clar` (Need to deploy)

---

## 🎨 UI/UX Improvements Needed

1. **Loading States**: Add skeleton loaders for all data fetching
2. **Empty States**: Better empty state designs
3. **Error States**: User-friendly error messages
4. **Success Feedback**: Clear success indicators
5. **Confirmation Modals**: Add confirmations for destructive actions
6. **Mobile Navigation**: Improve mobile menu
7. **Accessibility**: Add ARIA labels, keyboard navigation

---

## 🧪 Testing Strategy

1. **Unit Tests**: Test utility functions
2. **Integration Tests**: Test contract interactions
3. **E2E Tests**: Test complete user flows
4. **Manual Testing**: Test on real testnet
5. **Security Audit**: Review all contract interactions

---

## 📚 Documentation Needed

1. User guide for connecting wallets
2. Developer guide for contract interactions
3. API documentation for backend (when ready)
4. Deployment guide
5. Troubleshooting guide


