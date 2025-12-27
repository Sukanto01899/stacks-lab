# Stacks Lab

Bitcoin-native superapp on Stacks: chat, profiles, marketplace, and launchpad secured by Bitcoin.

**Live demo:** https://stackslab.vercel.app

---

## What’s inside
- .btc login with Leather/Xverse and profile resolution.
- Profiles with STX/sBTC balances, NFTs, and activity via Hiro APIs.
- Avatar marketplace (100 supply) for minting and trading.
- Encrypted messaging backed by Socket.IO and Redis.
- Launchpad flows for SIP-010 tokens and SIP-009 NFTs.

## Tech stack
- Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, Zustand.
- Stacks.js for wallet/auth/transactions; Reown for Bitcoin wallets.
- Node.js backend (Express + Socket.IO + Redis + Postgres via Drizzle).
- Clarity contracts (traits, avatars, marketplace, reputation, launchpad).

## Repository layout
- `app/` – Next.js routes and pages.
- `components/`, `ui/` – shared UI.
- `lib/`, `hooks/`, `store/`, `types/` – utilities, hooks, state, typings.
- `backend/` – Express/Socket.IO service (Redis + Postgres).
- `contracts/` – Clarity contracts and traits.
- `public/` – static assets and manifest.
- `scripts/`, `deployments/`, `settings/` – helper configs and plans.

## Prerequisites
- Node.js 20+ and npm.
- Backend: Postgres and Redis available locally or via URLs.
- Contracts: Clarinet CLI if deploying locally.

## Environment
Copy the template and fill values:
```bash
cp .env.example .env
```
Key variables:
- `NEXT_PUBLIC_STACKS_NETWORK` – `testnet` or `mainnet`.
- `NEXT_PUBLIC_BACKEND_URL` – backend base URL; empty for local dev.
- `DATABASE_URL`, `REDIS_URL`, `PORT`, `NODE_ENV` – backend runtime settings.
- `NEXT_PUBLIC_REOWN_PROJECT_ID` – Reown AppKit project ID (optional but recommended).

## Run the frontend
```bash
npm install
npm run dev    # http://localhost:3000
# npm run build && npm start  # production
# npm run lint                # linting
```

## Run the backend
```bash
cd backend
npm install
npm run dev        # starts on PORT (default 3001)
# npm run build && npm start   # compile TS then run
# npm run migrate              # push Drizzle schema to Postgres
```
Ensure `DATABASE_URL` and `REDIS_URL` point to reachable services.

## Contracts
- Contracts live in `contracts/` (avatars, marketplace, launchpad, reputation, liquidity-locker, SIP-009/010 traits).
- Deployment order and manual steps: see `DEPLOYMENT_GUIDE.md`.
- Clarinet configuration: `Clarinet.toml`.

## Notes and next steps
- Wallet UX and loading/error states are tracked in `FRONTEND_AUDIT.md`.
- sBTC FT event fetching is stubbed in `backend/src/services/sbtc.ts`; implement when ready.

Made by the Stacks Lab team.
