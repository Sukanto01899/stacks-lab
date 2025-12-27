import { openContractCall } from '@stacks/connect';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { PostConditionMode, Pc, uintCV, stringAsciiCV, principalCV } from '@stacks/transactions';
import { getUserSession } from './stacks-client';

export const CONTRACT_ADDRESS_TESTNET = 'ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT';
const CONTRACT_ADDRESS_MAINNET = 'SP1G4ZDXED8XM2XJ4Q4GJ7F4PG4EJQ1KKXRCD0S3K';

export const CONTRACTS = {
  TESTNET: {
    AVATARS: `${CONTRACT_ADDRESS_TESTNET}.stacks-hub-avatars-v5`,
    MARKETPLACE: `${CONTRACT_ADDRESS_TESTNET}.marketplace-v4`,
    LAUNCHPAD: `${CONTRACT_ADDRESS_TESTNET}.launchpad-v4`,
    REPUTATION: `${CONTRACT_ADDRESS_TESTNET}.reputation-v4`,
    LIQUIDITY_LOCKER: `${CONTRACT_ADDRESS_TESTNET}.liquidity-locker-v4`,
  },
  MAINNET: {
    AVATARS: `${CONTRACT_ADDRESS_MAINNET}.stacks-hub-avatars-v5`,
    MARKETPLACE: `${CONTRACT_ADDRESS_MAINNET}.marketplace-v4`,
    LAUNCHPAD: `${CONTRACT_ADDRESS_MAINNET}.launchpad-v4`,
    REPUTATION: `${CONTRACT_ADDRESS_MAINNET}.reputation-v4`,
    LIQUIDITY_LOCKER: `${CONTRACT_ADDRESS_MAINNET}.liquidity-locker-v4`,
  }
};

const CONTRACT_NAME = 'stacks-hub-avatars';

// Helper to get network config
const getNetworkConfig = (networkType: 'testnet' | 'mainnet') => {
  const network = networkType === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
  const contracts = networkType === 'mainnet' ? CONTRACTS.MAINNET : CONTRACTS.TESTNET;
  const userAddress = getUserSession().loadUserData().profile.stxAddress[networkType];
  return { network, contracts, userAddress };
};

export async function mintAvatar(uri: string, networkType: 'testnet' | 'mainnet' = 'testnet') {
  const { network, contracts, userAddress } = getNetworkConfig(networkType);
  const postCondition = Pc.principal(userAddress).willSendLte(100000000).ustx();

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: contracts.AVATARS.split('.')[0],
      contractName: contracts.AVATARS.split('.')[1],
      functionName: 'mint',
      functionArgs: [
        stringAsciiCV(uri)
      ],
      network,
      stxAddress: userAddress,
      postConditions: [postCondition],
      postConditionMode: PostConditionMode.Deny,
      userSession: getUserSession(),
      onFinish: (data) => resolve(data),
      onCancel: () => reject('User cancelled'),
    });
  });
}

// --- Launchpad Functions ---

export async function launchToken(
  name: string,
  symbol: string,
  decimals: number,
  tokenContract: string,
  metadataUrl: string,
  targetStx: number,
  endBurnHeight: number,
  networkType: 'testnet' | 'mainnet' = 'testnet'
) {
  const { network, contracts, userAddress } = getNetworkConfig(networkType);
  const [contractAddress, contractName] = contracts.LAUNCHPAD.split('.');

  // Launchpad doesn't take STX, it just registers. No post conditions needed usually unless there's a fee.
  // However, we might want to ensure the user is the one calling it.

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'launch-token',
      functionArgs: [
        principalCV(tokenContract),
        stringAsciiCV(name),
        stringAsciiCV(symbol),
        uintCV(decimals),
        stringAsciiCV(metadataUrl),
        uintCV(endBurnHeight),
        uintCV(targetStx)
      ],
      network,
      stxAddress: userAddress,
      postConditionMode: PostConditionMode.Allow, // Allow for now as we might be interacting with new tokens
      userSession: getUserSession(),
      onFinish: (data) => resolve(data),
      onCancel: () => reject('User cancelled'),
    });
  });
}

export async function buyToken(
  tokenContract: string,
  stxAmount: number,
  networkType: 'testnet' | 'mainnet' = 'testnet'
) {
  const { network, contracts, userAddress } = getNetworkConfig(networkType);
  const [contractAddress, contractName] = contracts.LAUNCHPAD.split('.');

  // Post Condition: User sends STX to Launchpad
  const postCondition = Pc.principal(userAddress).willSendEq(stxAmount).ustx();

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'buy',
      functionArgs: [
        principalCV(tokenContract),
        uintCV(stxAmount)
      ],
      network,
      stxAddress: userAddress,
      postConditions: [postCondition],
      postConditionMode: PostConditionMode.Allow, // Allow minting of new tokens
      userSession: getUserSession(),
      onFinish: (data) => resolve(data),
      onCancel: () => reject('User cancelled'),
    });
  });
}

export async function sellToken(
  tokenContract: string,
  tokenAmount: number,
  networkType: 'testnet' | 'mainnet' = 'testnet'
) {
  const { network, contracts, userAddress } = getNetworkConfig(networkType);
  const [contractAddress, contractName] = contracts.LAUNCHPAD.split('.');

  // Post Condition: User sends Tokens (Fungible) to Launchpad logic? 
  // Actually the 'sell' function burns them on behalf of user.
  // So we might need a post condition that says user will burn/transfer.
  // Simplest is Allow mode for MVP.

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'sell',
      functionArgs: [
        principalCV(tokenContract),
        uintCV(tokenAmount)
      ],
      network,
      stxAddress: userAddress,
      postConditionMode: PostConditionMode.Allow,
      userSession: getUserSession(),
      onFinish: (data) => resolve(data),
      onCancel: () => reject('User cancelled'),
    });
  });
}

export async function claimVestedTokens(
  tokenContract: string,
  networkType: 'testnet' | 'mainnet' = 'testnet'
) {
  const { network, contracts, userAddress } = getNetworkConfig(networkType);
  const [contractAddress, contractName] = contracts.LAUNCHPAD.split('.');

  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress,
      contractName,
      functionName: 'claim-vested-tokens',
      functionArgs: [
        principalCV(tokenContract)
      ],
      network,
      stxAddress: userAddress,
      postConditionMode: PostConditionMode.Allow,
      userSession: getUserSession(),
      onFinish: (data) => resolve(data),
      onCancel: () => reject('User cancelled'),
    });
  });
}

// --- Utils ---

export async function getBitcoinBlockHeight(networkType: 'testnet' | 'mainnet' = 'testnet'): Promise<number> {
  const apiUrl = networkType === 'mainnet'
    ? 'https://api.hiro.so'
    : 'https://api.testnet.hiro.so';
  const response = await fetch(`${apiUrl}/v2/info`);
  const data = await response.json();
  return data.burn_block_height;
}

// --- Generators ---

export function generateSip010Contract(name: string, symbol: string, decimals: number, supply: number, uri: string) {
  // Hardcoded Launchpad addresses for permissions
  const LAUNCHPAD_TESTNET = `${CONTRACT_ADDRESS_TESTNET}.launchpad-v4`;
  const LAUNCHPAD_MAINNET = `${CONTRACT_ADDRESS_MAINNET}.launchpad-v4`;

  // Using our freshly deployed V4 trait for Clarity 4 compatibility
  const TRAIT_REF = `${CONTRACT_ADDRESS_TESTNET}.sip010-ft-trait-v4.sip010-ft-trait`;

  return `
;; ${name} Token (${symbol})
;; Generated by Stacks Lab Launchpad

(impl-trait '${TRAIT_REF})
(impl-trait '${LAUNCHPAD_TESTNET}.launchable-token-trait) ;; Assuming Testnet deploy for now

(define-fungible-token ${symbol.toLowerCase()})

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))

(define-data-var token-uri (optional (string-utf8 256)) (some u"${uri}"))

;; Launchpad Access
(define-constant LAUNCHPAD_PRINCIPAL '${LAUNCHPAD_TESTNET})

(define-public (mint (amount uint) (recipient principal))
    (begin
        (asserts! (or (is-eq tx-sender contract-owner) (is-eq tx-sender LAUNCHPAD_PRINCIPAL)) err-owner-only)
        (ft-mint? ${symbol.toLowerCase()} amount recipient)
    )
)

(define-public (burn (amount uint) (sender principal))
    (begin
        (asserts! (or (is-eq tx-sender contract-owner) (is-eq tx-sender LAUNCHPAD_PRINCIPAL)) err-owner-only)
        (ft-burn? ${symbol.toLowerCase()} amount sender)
    )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (try! (ft-transfer? ${symbol.toLowerCase()} amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-read-only (get-name)
    (ok "${name}")
)

(define-read-only (get-symbol)
    (ok "${symbol}")
)

(define-read-only (get-decimals)
    (ok u${decimals})
)

(define-read-only (get-balance (who principal))
    (ok (ft-get-balance ${symbol.toLowerCase()} who))
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply ${symbol.toLowerCase()}))
)

(define-read-only (get-token-uri)
    (ok (var-get token-uri))
)

(define-public (set-token-uri (value (string-utf8 256)))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set token-uri (some value))
        (ok true)
    )
)
  `;
}
