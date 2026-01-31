Stacks Lab - Architecture DocumentationProject OverviewStacks Lab is the all-in-one superapp for the Stacks ecosystem — a decentralized platform for encrypted messaging, .btc profile management, and no-code token/NFT launchpads, all secured on Bitcoin via Stacks. It combines social features with DeFi tools, enabling users to chat privately, showcase on-chain reputations, and launch SIP-021 tokens or NFTs seamlessly.Tagline: "Message, Profile, Launch — All on Bitcoin's Secure Layer"Context: Built for the 2025 Stacks ecosystem surge post-Nakamoto and sBTC upgrades, targeting Bitcoin L2 adoption.VisionCreate a unified Bitcoin-native app that bridges social interactions with on-chain creativity and finance. By leveraging .btc identities for authentication, Gaia for private storage, and Clarity for trustless launches, Stacks Lab eliminates centralized silos like Telegram + Pump.fun, fostering a secure, user-owned ecosystem where users earn from their creations without intermediaries.Technology Stack (Optimized for 2025 Efficiency)FrontendFramework: Next.js 15 (App Router, Streaming, Suspense)
UI Components: shadcn/ui + Tailwind CSS + Radix UI
Web3 Integration: @stacks
/connect + @leather
.io/wallet-sdk (for .btc auth and transactions)
State Management: Zustand with middleware (persist, immer for immutable updates)
Type Safety: TypeScript (strict mode, with ts-reset for enhanced inference)
Performance: React Server Components, Partial Prerendering, Next.js Image Optimization

BackendFramework: Node.js 22 with Express.js (minimal, type-safe with ts-rest)
Database: PostgreSQL (via Railway, with Drizzle ORM for type-safe queries)
Real-time: Redis (pub/sub for messaging, caching)
API: REST + WebSockets (ws library, secured with JWT or signed messages)
Blockchain Proxy: Hiro API for Stacks queries, avoiding direct client-side overload

Blockchain LayerSmart Contracts: Clarity (SIP-021 for tokens, SIP-015 for NFTs, via Megapont forks)
Network: Stacks Mainnet (post-3.0 upgrades for faster finality)
Payments: sBTC/STX micropayments (integrated with Hiro Payment API)
Storage: Gaia (decentralized, encrypted file storage tied to .btc)
Encryption: @stacks
/encryption (libsodium-wasm for E2EE messaging)

InfrastructureFrontend Hosting: Vercel (edge functions, preview deploys, automatic scaling)
Backend Hosting: Railway (Postgres + Redis services, private networking)
No Monolith: Split frontend/backend for independent scaling
CI/CD: GitHub Actions (lint, test, deploy on push)
Monitoring: Vercel Analytics + Railway Logs (with Sentry for error tracking)

Project Structure

stacks-hub/
│
├── frontend/                      # Next.js application (deployed to Vercel)
│   ├── app/                       # App Router
│   │   ├── (auth)/                # Authenticated routes
│   │   │   └── layout.tsx
│   │   ├── chat/                  # Messaging routes
│   │   │   └── [id]/page.tsx
│   │   ├── profile/               # .btc profiles
│   │   │   └── [handle]/page.tsx
│   │   ├── launchpad/             # No-code launch
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx               # Landing + wallet connect
│   ├── components/                # Reusable UI
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── wallet/                # Leather connect components
│   │   ├── chat/                  # Message bubbles, input
│   │   ├── profile/               # Profile cards, reputation
│   │   └── launchpad/             # Forms, previews
│   ├── lib/                       # Utilities
│   │   ├── api.ts                 # Railway backend client (fetch wrappers)
│   │   ├── stacks.ts              # Wallet, .btc resolver, tx helpers
│   │   ├── gaia.ts                # Encrypted storage
│   │   └── encryption.ts          # E2EE helpers
│   ├── store/                     # Zustand stores
│   │   ├── useUserStore.ts
│   │   ├── useChatStore.ts
│   │   └── useLaunchpadStore.ts
│   ├── hooks/                     # Custom hooks
│   │   ├── useWallet.ts
│   │   ├── useRealtime.ts         # Redis pub/sub hook
│   │   └── useBtcName.ts
│   ├── types/                     # Shared types
│   │   ├── user.ts
│   │   ├── message.ts
│   │   └── launch.ts
│   ├── styles/                    # Tailwind globals
│   ├── public/                    # Static assets
│   ├── next.config.js             # Vercel optimizations
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                       # Node.js API (deployed to Railway)
│   ├── src/                       # Source code
│   │   ├── routes/                # Express routes
│   │   │   ├── messages.ts        # Chat endpoints
│   │   │   ├── profiles.ts        # .btc aggregation
│   │   │   └── launchpad.ts       # Contract proxies
│   │   ├── services/              # Business logic
│   │   │   ├── gaiaProxy.ts       # Gaia interactions
│   │   │   ├── clarity.ts         # Tx broadcasting
│   │   │   └── realtime.ts        # Redis pub/sub
│   │   ├── middleware/            # Auth, rate limiting
│   │   │   ├── auth.ts            # Signed message verification
│   │   │   └── cors.ts
│   │   ├── db/                    # Drizzle schema
│   │   │   └── schema.ts
│   │   └── server.ts              # Express entry
│   ├── prisma/                    # Optional migration fallback
│   ├── railway.toml               # Railway config
│   ├── tsconfig.json
│   └── package.json
│
├── contracts/                     # Clarity contracts
│   ├── launchpad-v9.clar             # SIP-021/NFT minting
│   ├── reputation-v9.clar            # On-chain scores
│   └── deployed.json              # Mainnet addresses
│
├── tests/                         # Tests
│   ├── frontend/                  # React Testing Library
│   ├── backend/                   # Supertest + Vitest
│   └── e2e/                       # Playwright (full app flows)
│
├── docs/                          # Documentation
│   ├── DEMO.md                    # User guide
│   ├── SECURITY.md                # Security practices
│   └── WORKFLOW.md                # Message/launch flows
│
├── .env.example                   # Env template
├── .gitignore
├── README.md
├── ARCHITECTURE.md                # This file
└── package.json                   # Workspace root

System ArchitectureHigh-Level Data Flow

┌─────────────────────────────────────────────────────────────┐
│                    USER (Web Browser)                       │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Next.js on Vercel)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Chat UI    │  │ Profile View │  │ Launchpad    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌───────────────────────────────────────────────────┐      │
│  │  Leather Wallet + .btc Auth + Zustand State       │      │
│  └───────────────────────────────────────────────────┘      │
└────────┬────────────────────────────────┬───────────────────┘
         │                                │
         ▼                                ▼
┌────────────────────────┐      ┌────────────────────────────┐
│   BACKEND (Railway)    │      │   STACKS BLOCKCHAIN        │
│                        │      │                            │
│  ┌──────────────────┐  │      │  ┌──────────────────────┐  │
│  │  Express API     │  │      │  │  Clarity Contracts   │  │
│  │  - /messages     │  │      │  │  - launchToken()     │  │
│  │  - /profiles     │  │      │  │  - updateReputation()│  │
│  │  - /launchpad    │  │      │  │  - SIP-021/NFT       │  │
│  └──────────────────┘  │      │  └──────────────────────┘  │
│                        │      │                            │
│  ┌──────────────────┐  │      └────────────────────────────┘
│  │  Postgres DB     │  │                   ▲
│  │  - Chat history  │  │                   │
│  │  - Profile cache │  │                   │
│  └──────────────────┘  │                   │
│                        │                   │
│  ┌──────────────────┐  │                   │
│  │  Redis (Pub/Sub) │  │                   │
│  │  - Real-time     │  │                   │
│  │  - Caching       │  │                   │
│  └──────────────────┘  │                   │
└────────────────────────┘                   │
         ▲                                   │
         │                                   │
         │                                   │
┌────────┴────────────────────────────────┐  │
│          GAIA STORAGE                   │  │
│                                         │  │
│  ┌──────────────────────────────────┐   │  │
│  │  Encrypted Messages              │   │  │
│  │  - E2EE blobs per user           │   │  │
│  └──────────────────────────────────┘   │  │
│                                         │  │
│  ┌──────────────────────────────────┐   │  │
│  │  Profile Assets                  │   │  │
│  │  - NFTs, tokens, metadata        │───┼──┘
│  └──────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘

Core Components1. Frontend Layer (/frontend/)PurposeDeliver a responsive, edge-optimized UI for messaging, profiles, and launches, with direct wallet integration for seamless on-chain actions.Key Features.btc Auth: Leather connect resolves .btc names, no passwords.
Messaging: E2EE chats with real-time updates via Railway WebSockets.
Profiles: Aggregate on-chain data (NFTs, tokens, reputation) from Hiro API.
Launchpad: No-code forms for SIP-021 tokens/NFTs, preview before broadcast.

Key Filesapp/page.tsx - Landing with wallet CTA.
app/chat/[id]/page.tsx - Dynamic chat rooms.
app/profile/[handle]/page.tsx - .btc profile views.
app/launchpad/page.tsx - Token/NFT creation wizard.
components/wallet/ConnectButton.tsx - Leather integration.
components/chat/MessageBubble.tsx - Encrypted message rendering.
lib/api.ts - Typed fetch to Railway backend.
lib/stacks.ts - Transaction builders.
store/useChatStore.ts - Persisted chat state.

Best PracticesUse React Server Components for initial loads.
Lazy-load client components with Suspense.
Accessibility: ARIA labels on all interactive elements.
Performance: Image optimization, bundle splitting.

2. Backend Layer (/backend/)PurposeProxy blockchain interactions, handle real-time, and cache non-sensitive data for efficiency, while keeping all critical logic decentralized.Key FeaturesAPI Endpoints: Secure proxies for Clarity calls, Gaia uploads.
Real-time: Redis pub/sub for message notifications.
Database: Postgres for off-chain indexes (e.g., chat metadata, not content).
Security: Signed message auth, rate limiting (express-rate-limit).

Key Filessrc/server.ts - Express setup with CORS, middleware.
src/routes/messages.ts - Handle pub/sub, store metadata.
src/services/clarity.ts - Broadcast transactions via Hiro.
src/db/schema.ts - Drizzle schema for type-safe DB.
src/middleware/auth.ts - Verify Stacks signed messages.

Best PracticesType-safe: ts-rest for API contracts.
Efficient: Redis caching for frequent queries.
Secure: No private keys stored; all signing client-side.
Scalable: Railway auto-scales; use bullmq for queues if needed.

3. Blockchain Layer (/contracts/)PurposeEnforce trustless launches and reputation, using Clarity for Bitcoin-secured execution.Contract: Launchpad (launchpad-v9.clar)Key Functions:create-token(name, supply, decimals): Mints SIP-021 token.
create-nft(collection-name, uris): Mints SIP-015 NFTs.
collect-fee(amount): STX/sBTC fees to treasury.

State:Maps for token metadata, owner balances.

Contract: Reputation (reputation-v9.clar)Key Functions:update-score(principal, score): Adjusts reputation based on launches.
get-score(principal): Queries score.

Best PracticesAudited forks from Megapont.
Use SIP standards for interoperability.
Gas optimization: Batch operations.

4. Storage & EncryptionGaia IntegrationPrivate, decentralized storage for messages/profiles.
E2EE: Encrypt with recipient's public key before upload.

Best PracticesNever store plaintext; decrypt client-side.
Use libsodium for modern crypto primitives.

Operational LifecycleAuth & Profile SetupUser connects Leather, signs message.
Resolve .btc name via BNS.
Fetch/cache profile data from Railway.

Messaging FlowEncrypt message client-side.
Upload to Gaia.
Post metadata to Railway (for notifications).
Real-time delivery via Redis pub/sub.

Launch FlowFill no-code form.
Preview tx on frontend.
Broadcast via Railway proxy.
Update reputation on-chain.

Key Design Principles1. Decentralized FirstCritical data on-chain/Gaia; backend only for speed.

2. Security FocusE2EE everywhere; signed auth; CSP headers.
Audit paths: Use audited libs (stacks.js, libsodium).

3. Efficiency & ReusabilityModular components/hooks; type-safe everywhere.
Caching: Redis for hot data.

4. Modern Best Practices (2025)Next.js 15 features; Drizzle for DB.
Zero-trust: Client-side signing.
Reusable: Export components as library.

Testing StrategyUnit: Vitest for hooks/utils.
Integration: Supertest for backend.
E2E: Playwright for flows.
Coverage: 90%+ on critical (auth, encryption).

Deployment StrategyFrontend: vercel deploy --prod.
Backend: Railway from Git; auto-services.
Contracts: Clarinet deploy to mainnet.

Risk MitigationDowntime: Vercel/Railway SLAs.
Security: Regular audits, bug bounties.

Success CriteriaMVP: Live messaging, profiles, launches.
Metrics: 100 users, 1k messages, 50 launches.

Future EnhancementsAI integrations (Grok API in chats).
Mobile: PWA support.
Governance: DAO for fees.

Final SummaryCategory
Details
Product Name
Stacks Lab
Tagline
Message, Profile, Launch — All on Bitcoin's Secure Layer
Core Tech
Next.js + Railway + Clarity + Gaia + Leather
Key Innovation
Bitcoin-native social + DeFi superapp
Infrastructure
Split deploy (Vercel/Railway), decentralized storage
Deployment
Vercel (frontend), Railway (backend), Stacks Mainnet (contracts)
Business Model
Fees on launches (0.5-2% in STX/sBTC)
Vision
Empower Stacks users with secure, on-chain tools

Document Version: 1.0
Last Updated: 2025-12-06
Maintainer: Lead Software Architect
Status: Ready for Implementation



