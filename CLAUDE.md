# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Preferences

- Prefer concise versions
- Use concise commit comments
- Don't automatically commit changes

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint errors
npm run typecheck    # TypeScript type checking
npm run gcp:build    # Deploy to Cloud Run (requires gcloud auth)
npm run gcp:logs     # Read recent Cloud Run logs
npm run gcp:logs:tail # Stream Cloud Run logs
```

Minimum bar: `npm run lint` and `npm run typecheck` must pass.

## Architecture

Next.js 15 + React 18 app with GraphQL API, Claude AI code generation, and Firestore.

**Key directories:**
- `src/pages/` - Routes and API handlers (`/api` for GraphQL endpoint)
- `src/components/` - React components
- `src/lib/` - Core services (code-generation-service.ts, claude-stream-service.ts, embedding-service.ts)
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utilities including storage abstraction (Firestore/Memory)

**Code generation flow:**
User prompt → RAG vector search → DSPy prompt compilation (optional) → Claude streaming → Graffiticode API verification → error correction if needed

**External services:**
- Graffiticode API (api.graffiticode.org) - language compilation
- Claude API - code generation
- OpenAI - embeddings (text-embedding-3-small)
- DSPy service - prompt optimization (configurable via DSPY_SERVICE_URL)
- Firebase/Firestore - auth and storage
- Stripe - payments

**Authentication:**
- Primary: Ethereum wallet sign-in (via SIWE - Sign-In with Ethereum)
- Email magic-link sign-in via Privy (`@privy-io/react-auth`): user enters email → receives a 6-digit code → Privy generates an embedded Ethereum wallet → that wallet signs the existing SIWE nonce → SIWE pipeline proceeds unchanged. Hook: `src/hooks/use-email-signin.ts`. The verified email is stored on the user doc as `signInEmail` (read-only, shown in Profile under User ID; distinct from `notificationEmail` which is opt-in). `<PrivyProvider>` is mounted in `src/pages/_app.tsx` between Firebase and Wagmi providers. Build-time env: `NEXT_PUBLIC_PRIVY_APP_ID` (set in `.env.production` for prod, `.env.local` for dev).
- Google OAuth is NOT a sign-in method. It exists only as an account-linking option in `/settings` (`OAuthCard`); existing linked accounts retain access via the Ethereum-wallet path.
- Auth hook: `useGraffiticodeAuth` in `src/hooks/use-graffiticode-auth.tsx`
- Server-side `authenticate()` in `src/pages/api/index.ts` accepts either a Firebase ID token OR a raw Graffiticode api key. Both paths return `{uid, idToken}` — the `idToken` is what's forwarded to api.graffiticode.org.

**Auth gotcha — api keys vs Firebase tokens:** api.graffiticode.org's auth middleware (`@graffiticode/auth` `client.verifyToken`) only accepts Firebase ID tokens / signed JWTs; it does NOT fall back to api-key lookup. So when forwarding a request from the console resolver to api.graffiticode.org (e.g., via `postTask`, `postApiCompile`, `getApiTask`), you must send a Firebase ID token. Raw api keys 401. The console centralizes this exchange in `src/lib/api-credentials.ts` `getCredentialsForApiKey(apiKey)` — caches per-key for ~55 min. Use this whenever you need to convert an api key into something api.graffiticode.org will accept. The MCP server intentionally forwards api keys verbatim and relies on this exchange.

**Free-plan tier (no-signin via MCP):**
- The console GraphQL endpoint also accepts requests with header `X-Free-Plan-Session: <opaque-id>` and no `Authorization`. Detected at `src/pages/api/index.ts` via `isFreePlanRequest`.
- Free-plan requests resolve to `auth.uid` = the FREE_PLAN_API_KEY's owner uid (decoded from the exchanged ID token). Items written under that account are tagged `freePlan: true`, `sessionNamespace: sha256(SALT + ":" + sessionId)`, and `expiresAt` (48h TTL).
- Reads filter by `sessionNamespace` so each MCP session only sees its own items.
- The browser console UI requires real sign-in; free-plan is hosted-only via the MCP server.
- Env vars: `FREE_PLAN_API_KEY`, `FREE_PLAN_NAMESPACE_SALT`, optional `FREE_PLAN_DAILY_SPEND_CAP_USD`, `FREE_PLAN_BURST_LIMIT`, `FREE_PLAN_DAILY_LIMIT`. Pushed via `scripts/set-free-plan-secrets.sh` from `.env.local` to Secret Manager + mounted on Cloud Run.

**Trial-claim flow (`/claim?token=<jwt>`):** the MCP server mints a 24h HS256 JWT signed with `FREE_PLAN_NAMESPACE_SALT` (audience `graffiticode-claim`, payload `{ sessionNamespace, sessionUuid }`) and returns it as `claim_url` on `create_item`/`update_item`. The console `/claim` page renders `<AuthMethodDialog variant="claim">`; on successful sign-in (email or wallet) it calls the `claimFreePlanSession(token)` GraphQL mutation. The resolver verifies the JWT via `src/lib/claim-token.ts`, queries `users/{trialUid}/items` matching `freePlan==true && sessionNamespace==X && expiresAt>now`, and copies each into the authenticated user's `users/{uid}/items/` collection with `taskId: null`, `code` preserved, `app: 'console'` (force-overridden so claims appear in the default `/items` view), free-plan flags cleared, and `claimedFrom: sessionUuid` for provenance. The claim resolver prefers fetching `code` **fresh from api.graffiticode.org via trial auth** (`getApiTask({ id: data.taskId, auth: trialAuth })`) over trusting the stored `data.code`, so claims still produce correct content even if the Firestore copy went stale. Tasks lazily re-post under the new uid on first read via the existing guards in `getItems`/`getItem` (precondition: `createItem` AND `updateItem` both persist the parsed AST as `code` on the Firestore item doc whenever taskId changes — required because tasks on api.graffiticode.org stay owned by the trial uid; the lazy repost is what relocates them). For local testing, mint a JWT via `npx tsx scripts/mint-claim-token.ts <sessionUuid>`.

**Item `app` tag:** items are tagged with the source surface (`'console'`, `'mcp'`, `'front'`) at write time. The `/items` page filters by this tag — switch via the App selector chip in the header. MCP-created items default to `app: 'mcp'` and are invisible in the default Console view; switch to MCP to see them.

**`/api/compile` proxy:** browser-side compile (`src/utils/swr/fetchers.ts compile()`) goes through a Next.js API route proxy at `src/pages/api/compile.ts` rather than calling api.graffiticode.org directly. The proxy handles api-key → ID-token exchange so the browser never needs to hold a Firebase ID token for downstream calls (and free-plan callers don't need to expose FREE_PLAN_API_KEY).

## Code Style

- TypeScript with TailwindCSS
- PascalCase for components (`NewAPIKeyDialog.tsx`), camelCase for functions/variables
- Page files lowercase (`items.tsx`)
- 2-space indentation
- Functional components with hooks

## Scripts

Admin scripts in `scripts/` require Firebase service account credentials. Two separate projects are used:

```bash
# Add to ~/.zshrc
export GRAFFITICODE_CREDENTIALS=~/graffiticode-key.json        # graffiticode project
export GRAFFITICODE_APP_CREDENTIALS=~/graffiticode-app-key.json # graffiticode-app project
```

**graffiticode project** (API data):
- `npx tsx scripts/clear-compile.ts <taskId>` - Delete a compile record

**graffiticode-app project** (console data):
- `npx tsx scripts/adjust-overage-credits.ts <userId> <adjustment> [reason]` - Adjust user credits
- `npx tsx scripts/get-app-names.ts` - List app names from items
- `npx tsx scripts/update-embeddings.ts` - Update training example embeddings
- `npx tsx scripts/download-training-examples.ts` - Download training examples to markdown
- `npx tsx scripts/upgrade-basis-and-deploy.ts` - Upgrade @graffiticode/basis in all language repos and deploy
  - `--lang 0158 0166` - Only upgrade specific languages
  - `--no-force` - Skip deploy if basis is already up to date
  - `--verbose` - Stream build output to terminal
- `./scripts/set-free-plan-secrets.sh` - Push `FREE_PLAN_API_KEY` and `FREE_PLAN_NAMESPACE_SALT` from `.env.local` into Secret Manager and remount on the `console` Cloud Run service. Re-running rotates (creates a new secret version) and rolls a new revision. Rotating the salt invalidates active free-plan namespaces.

## Local Development

1. Configure `.env.local` with API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, Firebase config, etc.)
2. `npm run dev`
3. Run Graffiticode API/auth servers separately (see graffiticode/graffiticode repo)
