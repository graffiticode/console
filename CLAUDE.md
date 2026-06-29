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
Request → **scope-gate head routing** → **permission-governed composition** → per-stage code gen (RAG vector search → Claude streaming → Graffiticode API verification → error correction) → post-parse binding repair.

**Server-authoritative routing & composition** (see `docs/language-routing-and-composition.md` for the full per-language contract). The platform — not the client — decides which language a request lands in and how (if at all) it composes; a client's chosen `language` is a hint. Two independent server decisions in the `generateCode` resolver (`src/pages/api/resolvers.ts`):
- **Head routing** — `classifyAndRoute` (`src/lib/language-router.ts`, cheap Haiku) validates a fresh request against the target language's `scope.json` (`in_scope`/`out_of_scope`) and **re-routes to the correct language** if the client picked wrong (e.g. an ELA request sent to the spreadsheet dialect → re-routed to the ELA dialect). Fresh creates only (never relabels an edit); fail-open + logged (`[routing] … scope-gate …`/`preflight.reroute`). Flag: `SCOPE_GATE_ENABLED` (default on).
- **Composition** — governed by a hard `composesWith` allowlist on each language's `LANGUAGES` entry (`src/lib/languages.ts`): the planner may only propose upstream edges within it (`composesWithFor`/`fenceComposition`), the head is pinned to the routed language, and any unpermitted edge is dropped to atomic. Examples: `L0158:["0166"]` (Learnosity embeds a spreadsheet widget), `L0173:["0170"]` (chart binds a data source), most languages omit it (atomic). Flag: `COMPOSITION_ENABLED`. The post-parse repair regenerates the head once if it failed to emit the required `data use "<lang>"` binding, else fails with an actionable error.

**Cross-language content (`get_spec` round-trip):** moving an item's content into another language is a client-orchestrated round-trip — author the content in its specialist dialect → `get_spec(item_id)` (platform-neutral English spec, `src/lib/spec-generation-service.ts`) → `create_item(host_language, spec + intent)`. The server then decides **embed** (inner lang ∈ host's `composesWith` → live widget `+`-chain) vs **native reformat** (host re-authors from the spec). The agent never wires pipelines or names upstreams; `create_item` stays referentially transparent. Agent guidance lives in `graffiticode-skills/assessments/SKILL.md` ("two parts of the whole").

**Per-language Opus opt-in:** code generation defaults to Sonnet (`CLAUDE_MODELS.DEFAULT`), with Haiku for small property-only edits. A language whose generation is more subtle can opt its **initial** generation into Opus by placing `<!-- gc:model=opus -->` anywhere in its `instructions.md` (served by its l0NNN service). The directive is parsed + stripped during the instructions fetch in `src/lib/code-generation-service.ts` (`dialectOptsIntoOpus`), so it never reaches the LLM. Only the initial generation uses Opus; the error-correction/fix pass and all non-opted languages stay on the current Sonnet/Haiku scheme. An explicit caller `options.model` still overrides everything.

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
- `./scripts/set-compiler-secret.sh <lang>` - Propagate `GRAFFITICODE_SECRET_KEY` from the console secret (Secret Manager, project `graffiticode-app`) to a language/compiler Cloud Run service (e.g. `l0166`) in project `graffiticode`, mounting the identical key. Accepts `l0166`/`L0166`/`0166`. **The key MUST NEVER CHANGE** — the script refuses to overwrite an existing target key with a different value.

**Shared secret encryption (`get-val-private` / account Secrets):** values are encrypted at parse time (console, `src/lib/secret-crypto.ts`, used by `src/pages/api/resolvers.ts`) and decrypted at compile time (basis, `src/compiler.js`). The two `decrypt` implementations must stay in lockstep. The **identical keyring** must be present on the console runtime AND every `l0NNN` compiler service (the console encrypts; the compiler services decrypt). If no usable key is configured, `encrypt()` **throws** (never returns plaintext — so secrets are never stored/transported unencrypted); `setCredential` pre-checks `isConfigured()` (only when writing a secret) for a friendly error, and the `get-val-private` parse path surfaces the throw as a parse error. `decrypt()` stays lenient (returns the input unchanged on missing key / wrong key / tampered ciphertext) so the compile path doesn't crash on undecryptable values.

**Credentials (account `get-val-public` / `get-val-private`):** the `/settings` "Credentials" card (`src/components/CredentialsCard.tsx`) stores each credential **field as its own variable**, bound to code by the name **`<backend>-<field>`** (e.g. `learnosity-key`, `learnosity-secret`). Variables are split by visibility across **two physically separate Firestore docs under `users/{uid}/settings`**: the **credentials** doc `{ <name>: { backend?, value: <plaintext>, updatedAt } }` (public fields) and the **secrets** doc `{ <name>: { backend?, value: <ciphertext>, updatedAt } }` (private fields). Parse callbacks (`buildParseCallbacks` in `resolvers.ts`) read disjoint maps: `get-val-public "<name>"` → `getPublicValuesForUser` (credentials doc only), `get-val-private "<name>"` → `getSecretsForUser` (secrets doc only). The public read path never opens the secrets doc, so a secret can't leak in cleartext. A console-only registry `src/lib/credential-backends.ts` (`CREDENTIAL_BACKENDS`) declares known backends — `key` (the var-name prefix), `label`, an open-ended `fields[]` (each `{ name, label, visibility }`), `docsUrl` — driving the grouped add-credential form + native field labels. Field count is open-ended (a config with two public ids is just two public fields). `setCredential` writes one variable; **visibility is server-authoritative for known backends** (resolved from the registry via `fieldVisibilityFor`, so a client can't store a private field as public plaintext) and from the caller's `isPublic` for custom vars; the crypto check gates only private writes. The compiler maps the generic `<backend>-<field>` vars to the service's real field names (e.g. Learnosity `learnosity-key`→`consumer_key`, `learnosity-secret`→`consumer_secret`). GraphQL: `credentials` query (flat vars), `setCredential`/`deleteCredential` mutations (free-plan gated); the client groups vars by backend into one row per credential.

Two ciphertext formats are understood: legacy `<iv>:<enc>` (AES-256-CBC, deterministic IV) and versioned `v<N>:<iv>:<ct>:<tag>` (AES-256-GCM, random IV, authenticated). Env vars:
- `GRAFFITICODE_SECRET_KEY` — the canonical key; this is key **version 1** and the key for all legacy ciphertext. Created once; see the error output of `set-compiler-secret.sh`.
- `GRAFFITICODE_SECRET_KEYS` — optional JSON keyring for versions ≥2, e.g. `{"2":"<secret2>"}`. Needed (for decrypt) on every service before any value is written under that version.
- `GRAFFITICODE_SECRET_KEY_VERSION` — the version **new** writes use. Unset/`0` ⇒ legacy CBC (default, backward-compatible). Set to `N` (on the **console** only) to start writing GCM under key N.

**Rotation procedure** (the reason versioning exists — old ciphertext persists forever and only decrypts with the key that wrote it): (1) add key `N` to `GRAFFITICODE_SECRET_KEYS` on **all** services and redeploy so everything can *decrypt* it; (2) set `GRAFFITICODE_SECRET_KEY_VERSION=N` on the console so new writes use it; (3) lazily/backfill re-encrypt old values via `reencryptToCurrent()` in `secret-crypto.ts`; (4) once nothing references the old key, retire it. Never change the value of an existing key version. For local dev, set the same vars in `.env.local` and in the local API/compile server's env.

## Local Development

1. Configure `.env.local` with API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, Firebase config, etc.)
2. `npm run dev`
3. Run Graffiticode API/auth servers separately (see graffiticode/graffiticode repo)
