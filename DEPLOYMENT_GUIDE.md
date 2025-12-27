# 🚀 Manual Contract Deployment Guide

## ⚠️ The automated deployment failed due to a network error. Here's how to deploy manually:

---

## 📋 **Deployment Order (CRITICAL - Deploy in this exact order)**

### **Batch 1: Traits (Deploy First)**
1. ✅ `sip009-nft-trait-v4` - NFT trait interface
2. ✅ `sip010-ft-trait-v4` - FT trait interface

### **Batch 2: Core Contracts**
3. ✅ `reputation-v4` - Reputation system
4. ✅ `liquidity-locker-v4` - Liquidity locking

### **Batch 3: Main Contracts**
5. ✅ `stacks-hub-avatars-v5` - Avatar NFTs
6. ✅ `marketplace-v4` - NFT marketplace

### **Batch 4: Launchpad**
7. ✅ `launchpad-v4` - Token launcher

### **Batch 5: Configuration**
8. ✅ Call `set-authorized` on reputation contract to authorize launchpad

---

## 🌐 **Option 1: Deploy via Hiro Platform (Recommended)**

### Step 1: Go to Hiro Platform
Visit: https://platform.hiro.so/projects

### Step 2: Create/Select Project
- Create a new project or select existing
- Make sure you're on **Testnet**

### Step 3: Deploy Each Contract

For each contract in order:

1. Click **"Deploy Contract"**
2. **Contract Name**: Use exact names below
3. **Source Code**: Copy from the files
4. **Network**: Testnet
5. **Wallet**: Connect your wallet (ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT)

#### Contract 1: `sip009-nft-trait-v4`
```clarity
File: contracts/sip009-nft-trait.clar
Name: sip009-nft-trait-v4
Cost: ~0.05 STX
```

#### Contract 2: `sip010-ft-trait-v4`
```clarity
File: contracts/sip010-ft-trait.clar
Name: sip010-ft-trait-v4
Cost: ~0.05 STX
```

#### Contract 3: `reputation-v4`
```clarity
File: contracts/reputation.clar
Name: reputation-v4
Cost: ~0.2 STX
```

#### Contract 4: `liquidity-locker-v4`
```clarity
File: contracts/liquidity-locker.clar
Name: liquidity-locker-v4
Cost: ~0.2 STX
```

#### Contract 5: `stacks-hub-avatars-v5`
```clarity
File: contracts/stacks-hub-avatars.clar
Name: stacks-hub-avatars-v5
Cost: ~0.38 STX
```

#### Contract 6: `marketplace-v4`
```clarity
File: contracts/marketplace.clar
Name: marketplace-v4
Cost: ~0.25 STX
```

#### Contract 7: `launchpad-v4`
```clarity
File: contracts/launchpad.clar
Name: launchpad-v4
Cost: ~0.5 STX
```

### Step 4: Configure Reputation Contract
After all contracts are deployed, call this function:

**Contract**: `ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT.reputation-v4`
**Function**: `set-authorized`
**Parameters**:
- `authorized`: `'ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT.launchpad-v4`
- `enabled`: `true`

---

## 🖥️ **Option 2: Deploy via Leather Wallet**

### Step 1: Open Leather Wallet
- Make sure you're on Testnet
- Have at least 2 STX for deployment fees

### Step 2: Use Stacks Explorer
Visit: https://explorer.hiro.so/sandbox/deploy?chain=testnet

### Step 3: Deploy Each Contract
1. Paste contract code
2. Set contract name
3. Click "Deploy"
4. Confirm in Leather wallet

---

## 🔧 **Option 3: Deploy via Clarinet (Alternative)**

If you want to retry automated deployment:

```bash
# Install Stacks CLI
npm install -g @stacks/cli

# Deploy using Clarinet with manual confirmation
clarinet deployments apply -p deployments/default.testnet-plan.yaml --no-dashboard

# Or deploy contracts one by one
stx deploy contracts/sip009-nft-trait.clar sip009-nft-trait-v4 -t
stx deploy contracts/sip010-ft-trait.clar sip010-ft-trait-v4 -t
# ... etc
```

---

## ✅ **After Deployment Checklist**

Once all contracts are deployed:

1. ✅ Verify each contract on explorer:
   - https://explorer.hiro.so/txid/[TX_ID]?chain=testnet

2. ✅ Test contract calls:
   ```bash
   # Test avatar mint
   curl "https://api.testnet.hiro.so/v2/contracts/call-read/ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT/stacks-hub-avatars-v5/get-last-token-id"
   ```

3. ✅ Update frontend (already done in `lib/contracts.ts`)

4. ✅ Test minting an NFT from the UI

---

## 💰 **Total Deployment Cost**

- **Estimated**: 1.64 STX
- **Actual**: May vary based on network conditions
- **Make sure you have**: At least 2 STX in your wallet

---

## 🆘 **Troubleshooting**

### Error: "Insufficient Balance"
- Get testnet STX from faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet

### Error: "Contract already exists"
- Change contract name (add -v6, -v7, etc.)
- Or use a different deployer address

### Error: "Trait not found"
- Make sure you deployed traits (sip009, sip010) first
- Check contract names match exactly

### Network timeout
- Wait a few minutes and try again
- Check Stacks testnet status: https://status.hiro.so

---

## 📝 **Deployment Log Template**

Keep track of your deployments:

```
✅ sip009-nft-trait-v4: [TX_ID]
✅ sip010-ft-trait-v4: [TX_ID]
✅ reputation-v4: [TX_ID]
✅ liquidity-locker-v4: [TX_ID]
✅ stacks-hub-avatars-v5: [TX_ID]
✅ marketplace-v4: [TX_ID]
✅ launchpad-v4: [TX_ID]
✅ set-authorized call: [TX_ID]
```

---

## 🎯 **Next Steps After Deployment**

1. Test NFT minting on marketplace
2. Test launchpad token creation
3. Integrate Reown for Bitcoin wallets
4. Add loading states and error handling
5. Deploy to production!

---

**Need help?** Check the Stacks Discord: https://discord.gg/stacks
