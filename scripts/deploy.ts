import {
    makeContractDeploy,
    broadcastTransaction,
    AnchorMode,
    contractPrincipalCV,
    getAddressFromPrivateKey
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { generateWallet, getStxAddress } from '@stacks/wallet-sdk';
import * as fs from 'fs';
import * as path from 'path';

const NETWORK = STACKS_TESTNET;

async function main() {
    const input = process.argv[2];
    if (!input) {
        console.error("Usage: npx ts-node scripts/deploy.ts <seed_phrase_or_private_key>");
        console.error("Example with seed phrase: npx ts-node scripts/deploy.ts \"word1 word2 word3 ...\"");
        console.error("Example with private key: npx ts-node scripts/deploy.ts abc123...");
        process.exit(1);
    }

    let privateKey: string;
    let senderAddress: string;

    // Check if input is a seed phrase (contains spaces) or private key
    if (input.includes(' ')) {
        // It's a seed phrase
        console.log("Detected seed phrase, deriving private key...");
        const wallet = await generateWallet({
            secretKey: input,
            password: ''
        });

        // Get the first account (index 0)
        const account = wallet.accounts[0];
        privateKey = account.stxPrivateKey;
        senderAddress = getStxAddress({ account, network: 'testnet' });

        console.log(`Derived address: ${senderAddress}`);
    } else {
        // It's a private key
        privateKey = input;
        senderAddress = getAddressFromPrivateKey(privateKey);
        console.log(`Deploying from account: ${senderAddress}`);
    }

    console.log("Starting Deployment sequence...");

    // Keep track of txids to print later
    const txs: Record<string, string> = {};

    // Helper to deploy
    const deploy = async (name: string, file: string) => {
        console.log(`Deploying ${name}...`);
        const code = fs.readFileSync(path.join(__dirname, '../contracts', file), 'utf8');

        const tx = await makeContractDeploy({
            codeBody: code,
            contractName: name,
            senderKey: privateKey,
            network: NETWORK
        });

        const broadcastResponse = await broadcastTransaction({
            transaction: tx,
            network: NETWORK
        });

        // Loose type check for success
        if ('error' in broadcastResponse && broadcastResponse.error) {
            const reason = (broadcastResponse as any).reason;
            console.error(`Error deploying ${name}:`, reason);
            throw new Error(reason);
        }

        const txId = broadcastResponse.txid;
        console.log(` -> Sent! TXID: ${txId}`);
        txs[name] = txId;
        return txId;
    };

    try {
        // Batch 1: Deploy traits first
        console.log("\n=== BATCH 1: Deploying Traits ===");
        await deploy('sip009-nft-trait-v4', 'sip009-nft-trait.clar');
        await new Promise(r => setTimeout(r, 8000));

        await deploy('sip010-ft-trait-v4', 'sip010-ft-trait.clar');
        await new Promise(r => setTimeout(r, 8000));

        // Batch 2: Deploy base contracts
        console.log("\n=== BATCH 2: Deploying Base Contracts ===");
        await deploy('reputation-v4', 'reputation.clar');
        await new Promise(r => setTimeout(r, 8000));

        await deploy('liquidity-locker-v4', 'liquidity-locker.clar');
        await new Promise(r => setTimeout(r, 8000));

        // Batch 3: Deploy NFT contracts
        console.log("\n=== BATCH 3: Deploying NFT Contracts ===");
        await deploy('stacks-hub-avatars-v5', 'stacks-hub-avatars.clar');
        await new Promise(r => setTimeout(r, 8000));

        await deploy('marketplace-v4', 'marketplace.clar');
        await new Promise(r => setTimeout(r, 8000));

        // Batch 4: Deploy main launchpad
        console.log("\n=== BATCH 4: Deploying Launchpad ===");
        await deploy('launchpad-v4', 'launchpad.clar');
        await new Promise(r => setTimeout(r, 8000));

        console.log("\n✅ ALL DEPLOYMENT TRANSACTIONS SENT!");
        console.log("================================================");
        console.log("📝 Deployed Contracts (Clarity 4):");
        console.log(`   1. Launchpad: ${senderAddress}.launchpad-v4`);
        console.log(`   2. Reputation: ${senderAddress}.reputation-v4`);
        console.log(`   3. Liquidity Locker: ${senderAddress}.liquidity-locker-v4`);
        console.log(`   4. Marketplace: ${senderAddress}.marketplace-v4`);
        console.log(`   5. Avatars NFT: ${senderAddress}.stacks-hub-avatars-v5`);
        console.log(`   6. SIP-009 Trait: ${senderAddress}.sip009-nft-trait-v4`);
        console.log(`   7. SIP-010 Trait: ${senderAddress}.sip010-ft-trait-v4`);
        console.log("================================================");
        console.log("🔗 NEXT STEPS:");
        console.log("1. Wait 10-15 mins for confirmations on testnet explorer:");
        console.log(`   https://explorer.hiro.so/address/${senderAddress}?chain=testnet`);
        console.log("\n2. Update lib/contracts.ts with these new addresses");
        console.log("\n3. Authorize launchpad in reputation contract:");
        console.log(`   Call: ${senderAddress}.reputation-v4.set-authorized`);
        console.log(`   Args: ${senderAddress}.launchpad-v4, true`);
        console.log("================================================");

    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
    }
}

main();
