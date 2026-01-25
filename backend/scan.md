# Deepscan Report: Stacks Lab (Full Stack)

## � Critical Architectural Deviations

### 1. Redis Pub/Sub Missing (Backend)
- **Architecture Requirement:** `architecture.md` specifies "Redis (pub/sub for messaging)" and "Stateless backend for scaling".
- **Current State:** `backend/src/server.ts` uses in-memory Socket.IO rooms (`socket.join`, `io.to`).
- **Impact:** If the backend scales to >1 instance on Railway, users connected to different instances **will not be able to chat**. Messages are isolated to the specific server instance.
- **Fix:** Implement Redis Adapter for Socket.IO (`@socket.io/redis-adapter`) to sync events across instances.

### 2. Frontend/Backend type Safety Gap
- **Issue:** `lib/api.ts` uses `any` for return types. `backend/src/routes` (inferred) likely doesn't share types with frontend.
- **Impact:** Breaking API changes won't be caught at compile time.
- **Fix:** Use a shared `types` package or monorepo workspace to share TypeScript interfaces between `frontend` and `backend`.

---

## � Critical Code & Security Issues

### 3. Type Safety Violations (Frontend & Backend)
- **Locations**:
  - `app/settings/page.tsx`: Usage of `any[]`, `nft: any`.
  - `hooks/useWallet.ts`: `payload: any`, untyped user session data.
  - `hooks/useRealtime.ts`: `data: any`.
  - `lib/api.ts`: `apiFetch<any>`.
- **Impact:** High risk of runtime errors (undefined is not a function).
- **Remediation:** Strictly define `NFT`, `Message`, and `UserSession` interfaces.

### 4. Hardcoded & Missing Configuration
- **Issue:** 
  - `lib/sbtc.ts`, `lib/api.ts`, `hooks/useRealtime.ts` hardcode `http://localhost`.
  - `backend/src/server.ts` hardcodes CORS origin fallback.
  - No `.env.example` in root (only in backend? No, missing there too).
- **Impact:** Production deployments will fail or behave unpredictably if env vars are missing. Security risk if CORS allows all.
- **Remediation:** Create `.env.example`, enforce env var presence at startup.

### 5. Socket Management (Anti-pattern)
- **Issue:** `hooks/useRealtime.ts` initializes `socket` as a module-level global variable.
- **Impact:** Can cause connection leaks in SSR or complex navigation flows. Hard to test.
- **Remediation:** Move socket instance to a Context Provider or Zustand store (as suggested in original scan).

---

## 🟡 Performance & Quality

### 6. Unoptimized Images (Frontend)
- **File:** `app/settings/page.tsx`
- **Issue:** Uses `<img>` tag instead of `next/image`.
- **Impact:** Poor LCP (Largest Contentful Paint) and cumulative layout shift.
- **Fix:** Replace with `<Image />` component.

### 7. Contract Integration
- **File:** `contracts/reputation-v2.clar`
- **Observation:** `sip010-ft-trait` usage needs to be verified against deployed mainnet address or local mock.
- **Status:** Needs validation in `Clarinet.toml` to ensure traits are properly aliased for mainnet/testnet.

---

## 📋 Action Plan (Prioritized)

### Phase 1: Architecture & Security (Immediate)
1. [ ] **Backend**: Implement Redis Adapter for Socket.IO in `server.ts`.
2. [ ] **Config**: Create `.env.example` and validation schema (Zod) for both Frontend and Backend.
3. [ ] **Types**: Create shared type definitions (or duplicate for now) to remove `any` from API calls.

### Phase 2: Reliability & Cleanup
4. [ ] **Frontend**: Refactor `useWallet` and `useRealtime` to remove global side-effects and fix deps.
5. [ ] **Frontend**: Replace `<img>` with `next/image` in Settings.
6. [ ] **Quality**: Run linter and fix unused imports/vars.

### Phase 3: Features & Polish
7. [ ] **Contracts**: Verify Trait implementations and deploy script.
8. [ ] **UI**: Virtualize lists in Chat and Profile for performance.
