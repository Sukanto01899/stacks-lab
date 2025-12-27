import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - Update with your mnemonic
const MNEMONIC = process.env.MNEMONIC || '';
const DEPLOYER_ADDRESS = 'ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT';

// Contracts to deploy in order
const CONTRACTS = [
  { name: 'sip009-nft-trait-v4', file: 'contracts/sip009-nft-trait.clar' },
  { name: 'sip010-ft-trait-v4', file: 'contracts/sip010-ft-trait.clar' },
  { name: 'reputation-v4', file: 'contracts/reputation.clar' },
  { name: 'liquidity-locker-v4', file: 'contracts/liquidity-locker.clar' },
  { name: 'stacks-hub-avatars-v5', file: 'contracts/stacks-hub-avatars.clar' },
  { name: 'marketplace-v4', file: 'contracts/marketplace.clar' },
  { name: 'launchpad-v4', file: 'contracts/launchpad.clar' },
];

async function getPrivateKey(mnemonic: string): Promise<string> {
  const { generateWallet } = await import('@stacks/wallet-sdk');
  const wallet = await generateWallet({
    secretKey: mnemonic,
    password: '',
  });
  return wallet.accounts[0].stxPrivateKey;
}

async function getNonce(address: string): Promise<number> {
  const response = await fetch(`https://api.testnet.hiro.so/extended/v1/address/${address}/nonces`);
  const data = await response.json();
  return data.possible_next_nonce;
}

async function deployContract(
  contractName: string,
  codeBody: string,
  privateKey: string,
  nonce: number
): Promise<string> {
  const network = STACKS_TESTNET;

  const txOptions = {
    contractName,
    codeBody,
    senderKey: privateKey,
    network,
    anchorMode: AnchorMode.OnChainOnly,
    postConditionMode: PostConditionMode.Allow,
    fee: BigInt(100000), // 0.1 STX
    nonce: BigInt(nonce),
    clarityVersion: 4,
  };

  const transaction = await makeContractDeploy(txOptions);
  const broadcastResponse = await broadcastTransaction({ transaction, network });

  if ('error' in broadcastResponse) {
    throw new Error(`Broadcast failed: ${broadcastResponse.error} - ${broadcastResponse.reason}`);
  }

  return broadcastResponse.txid;
}

async function main() {
  if (!MNEMONIC) {
    console.error('❌ Please set MNEMONIC environment variable');
    console.log('Usage: MNEMONIC="your seed phrase" npx tsx scripts/deploy-testnet.ts');
    process.exit(1);
  }

  console.log('🚀 Starting testnet deployment...\n');

  try {
    const privateKey = await getPrivateKey(MNEMONIC);
    let nonce = await getNonce(DEPLOYER_ADDRESS);

    console.log(`📍 Deployer: ${DEPLOYER_ADDRESS}`);
    console.log(`📍 Starting nonce: ${nonce}\n`);

    const results: { name: string; txid: string }[] = [];

    for (const contract of CONTRACTS) {
      console.log(`📦 Deploying ${contract.name}...`);

      const codeBody = fs.readFileSync(path.join(process.cwd(), contract.file), 'utf8');

      try {
        const txid = await deployContract(contract.name, codeBody, privateKey, nonce);
        console.log(`   ✅ TX: ${txid}`);
        console.log(`   🔗 https://explorer.hiro.so/txid/${txid}?chain=testnet\n`);

        results.push({ name: contract.name, txid });
        nonce++;

        // Wait a bit between deployments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}\n`);

        // If contract already exists, continue
        if (error.message.includes('ContractAlreadyExists')) {
          console.log(`   ℹ️  Contract already deployed, skipping...\n`);
          continue;
        }
        throw error;
      }
    }

    console.log('\n✅ Deployment complete!\n');
    console.log('📋 Summary:');
    results.forEach(r => {
      console.log(`   ${r.name}: ${r.txid}`);
    });

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

main();
