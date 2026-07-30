# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Preferences

- Prefer concise versions
- Use concise commit comments
- Don't automatically commit changes

## Commands

There is no unit-test runner (no `npm test`); `test:streaming` is a manual `tsx` script. The real gate is: `npm run lint` and `npm run typecheck` must pass.

## Architecture

Next.js 15 + React 18 app with GraphQL API, Claude AI code generation, and Firestore.

**Code generation flow:**
Request → **scope-gate head routing** → **permission-governed composition** → per-stage code gen (RAG vector search → Claude streaming → Graffiticode API verification → error correction) → post-parse binding repair.

**Server-authoritative routing & composition** (see `docs/language-routing-and-composition.md` for the full per-language contract). The platform — not the client — decides which language a request lands in and how (if at all) it composes; a client's chosen `language` is a hint. Two independent server decisions in the `generateCode` resolver (`src/pages/api/resolvers.ts`):
- **Head routing** — `classifyAndRoute` (`src/lib/language-router.ts`, cheap Haiku) validates a fresh request against the target language's `scope.json` (`in_scope`/`out_of_scope`) and **re-routes to the correct language** if the client picked wrong (e.g. an ELA request sent to the spreadsheet dialect → re-routed to the ELA dialect). Fresh creates only (never relabels an edit); fail-open + logged (`[routing] … scope-gate …`/`preflight.reroute`). Flag: `SCOPE_GATE_ENABLED` (default on).
- **Composition** — governed by a hard `composesWith` allowlist on each language's `LANGUAGES` entry (`src/lib/languages.ts`): the planner may only propose upstream edges within it (`composesWithFor`/`fenceComposition`), the head is pinned to the routed language, and any unpermitted edge is dropped to atomic. Examples: `L0158:["0166"]` (Learnosity embeds a spreadsheet widget), `L0173:["0170"]` (chart binds a data source), most languages omit it (atomic). Flag: `COMPOSITION_ENABLED`. The post-parse repair regenerates the head once if it failed to emit the required `data use "<lang>"` binding, else fails with an actionable error.

**Cross-language content (`get_spec` round-trip):** moving an item's content into another language is a client-orchestrated round-trip — author the content in its specialist dialect → `get_spec(item_id)` (platform-neutral English spec, `src/lib/spec-generation-service.ts`) → `create_item(host_language, spec + intent)`. The server then decides **embed** (inner lang ∈ host's `composesWith` → live widget `+`-chain) vs **native reformat** (host re-authors from the spec). The agent never wires pipelines or names upstreams; `create_item` stays referentially transparent. Agent guidance lives in `graffiticode-skills/assessments/SKILL.md` ("two parts of the whole").

**Per-language Opus opt-in:** code generation defaults to Sonnet (`CLAUDE_MODELS.DEFAULT`), with Haiku for small property-only edits. A language whose generation is more subtle can opt its **initial** generation into Opus by placing `<!-- gc:model=opus -->` anywhere in its `instructions.md` (served by its l0NNN service). The directive is parsed + stripped during the instructions fetch in `src/lib/code-generation-service.ts` (`dialectOptsIntoOpus`), so it never reaches the LLM. Only the initial generation uses Opus; the error-correction/fix pass and all non-opted languages stay on the current Sonnet/Haiku scheme. An explicit caller `options.model` still overrides everything.

**Authentication:**
- Primary: Ethereum wallet sign-in (via SIWE - Sign-In with Ethereum)
- Email magic-link sign-in via Privy (`@privy-io/react-auth`): user enters email → receives a 6-digit code → Privy generates an embedded Ethereum wallet → that wallet signs the existing SIWE nonce → SIWE pipeline proceeds unchanged. Hook: `useEmailSignIn` from `@graffiticode/auth-react` (source is a workspace package in the sibling **app** repo, `app/packages/auth-react`; the console consumes it from npm, so a fix there needs a publish + bump here). The verified email is written to **two places at once** (`recordSignInIdentity`, ≥0.7.0): `signInEmail` on the user doc, which Profile renders read-only as "Signed up with" next to User ID, and a row in the auth service's **linked-emails** store, which is what `/api/email-signin/resolve` matches on every later sign-in. Both, because writing only the first made returning users look new and get re-prompted to create an account they already had. Distinct from `notificationEmail` (contact address, editable, no auth power). Its Linked Emails row is deliberately **not removable** (`LinkedEmailsCard`, marked "sign-in identity"): unlike an added email it is not merely a stored credential — it derives the account's Privy embedded wallet, so deleting the row would hide it without revoking anything. **The wallet must be reused, never re-created** — minting a fresh embedded wallet changes the SIWE address and therefore the Firebase uid, silently moving the user to a different account (that was the ≤0.6.0 bug: sign-up read a stale `userRef` and created a wallet on every attempt). `<PrivyProvider>` is mounted in `src/pages/_app.tsx` between Firebase and Wagmi providers. Build-time env: `NEXT_PUBLIC_PRIVY_APP_ID` (set in `.env.production` for prod, `.env.local` for dev).
- Google OAuth is NOT a sign-in method. It exists only as an account-linking option in `/settings` (`OAuthCard`); existing linked accounts retain access via the Ethereum-wallet path.
- Auth hook: `useGraffiticodeAuth` in `src/hooks/use-graffiticode-auth.tsx`
- Server-side `authenticate()` in `src/pages/api/index.ts` accepts either a Firebase ID token OR a raw Graffiticode api key. Both paths return `{uid, idToken}` — the `idToken` is what's forwarded to api.graffiticode.org.

**Auth gotcha — api keys vs Firebase tokens:** api.graffiticode.org's auth middleware (`@graffiticode/auth` `client.verifyToken`) only accepts Firebase ID tokens / signed JWTs; it does NOT fall back to api-key lookup. So when forwarding a request from the console resolver to api.graffiticode.org (e.g., via `postTask`, `postApiCompile`, `getApiTask`), you must send a Firebase ID token. Raw api keys 401. The console centralizes this exchange in `src/lib/api-credentials.ts` `getCredentialsForApiKey(apiKey)` — caches per-key for ~55 min. Use this whenever you need to convert an api key into something api.graffiticode.org will accept. The MCP server intentionally forwards api keys verbatim and relies on this exchange.

**Free-plan tier (no-signin via MCP):** anonymous MCP sessions authenticated by `X-Free-Plan-Session`, metered in **items** (not dollars or compiles), items tagged `freePlan`/`sessionNamespace`/`expiresAt` (48h TTL). `sessionNamespace` means **workspace**, not "the session that created this" — a mutation on an existing item adopts its workspace. Browser console UI always requires real sign-in. Language scope (`freePlan?` in `src/lib/languages.ts`) ships inert. Details: skill `free-plan-and-claim`; runbook `docs/free-plan-attested-sessions.md`.

**Trial-claim flow (`/claim?token=<jwt>`) and the connect step:** the **console** — not the MCP server — mints the claim JWT, because only the console knows the effective (post-adoption) workspace. `claimFreePlanSession(token)` copies the namespace's items into the signed-in user's collection; claiming **copies rather than moves**, so `/claim` must then walk the user through connecting their agent or it keeps editing the anonymous originals. Details: skill `free-plan-and-claim`.

**Funnel events + walls (`src/lib/funnel-events.ts`):** one structured JSON line per lifecycle event to stdout → Cloud Logging; console-side twin of `graffiticode-mcp-server/src/events.ts`. `session` is the join key across all emitters. A **`wall_hit`** is a request refused by a limit (seven kinds) — free-plan walls emit from inside the `FreePlanError` builders, paid walls from the gate in `resolvers.ts`. Aggregated by ONE path (`src/lib/funnel-digest.ts`) feeding three surfaces: hourly SMS, signed `/r/<token>` report page, and `scripts/funnel-report.ts`. Details: skill `funnel-instrumentation`.

**Privacy contract (applies to every emitter, no exceptions):** never log prompts, item source, or free text (only lengths); never log raw session uuids, tokens, emails, or wallet addresses; never log the client IP.

**Item `app` tag:** items are tagged with the source surface (`'console'`, `'mcp'`, `'front'`) at write time. The `/items` page filters by this tag — switch via the App selector chip in the header. MCP-created items default to `app: 'mcp'` and are invisible in the default Console view; switch to MCP to see them.

**Item version history (`users/{uid}/versions`):** every content state of an item is recorded as a flat, append-only doc `{itemId}__{taskId}` — `recordVersion()` in `src/pages/api/resolvers.ts`, called from `createItem`, from `updateItem`'s `taskIdChanged` branch (the one signal every producer funnels through: chat, **direct editor edits**, the generation worker, MCP), and from the lazy-repost branches in `getItems`/`getItem` (where a shared/claimed item's v1 is born — the copy sites leave `taskId: null` and the original task isn't in the new uid's ACL). Records are **pointer-only**: taskIds are content-addressed and permanently stored by api.graffiticode.org, so code is never duplicated. Writes are create-if-absent, NOT set/merge — reverting re-derives the same taskId, and merging would overwrite that version's original `createdAt`/`source`; a revisit records `lastSeenAt` instead. `source` (`chat`/`editor`/`mcp`/`generation-job`/`claim`/`share`/`backfill`) is caller-supplied but clamped server-side. History does **not** cross accounts: share/claim start at v1. Read via the `taskVersions` query (lang/client/itemId filters, `createdAt desc`), which backs the `/tasks` list — a flat newest-first row per version, replacing the `compiles` feed that went silent on 2026-06-09 when Cloudflare edge-caching of `/data` stopped the api's origin callback from firing. Seed pre-existing history with `npx tsx scripts/backfill-item-versions.ts [--lang 0166] [--dry-run]` (idempotent; recovers taskIds from `help` transcripts, which never captured direct editor edits).

**`/api/compile` proxy:** browser-side compile (`src/utils/swr/fetchers.ts compile()`) goes through a Next.js API route proxy at `src/pages/api/compile.ts` rather than calling api.graffiticode.org directly. The proxy handles api-key → ID-token exchange so the browser never needs to hold a Firebase ID token for downstream calls (and free-plan callers don't need to expose FREE_PLAN_API_KEY).

**Item-based pricing & metering:** billing meters **successful items created per month** — iteration, reads, and compiles are free. `src/lib/plans-config.ts` (`PLANS`) is the single source of truth for tiers, allowances, overage rates, and Stripe price-id mappings; **never hardcode any of them** (that duplication was already removed once). Counting happens in `recordBillableItem()`, gating in `checkItemCreateAllowed()`. Details: skill `item-pricing`; full reference `docs/item-based-pricing.md`.

## Code Style

- PascalCase for components (`NewAPIKeyDialog.tsx`), camelCase for functions/variables
- Page files lowercase (`items.tsx`)

## Scripts

Admin scripts in `scripts/` require Firebase service account credentials from **two separate projects** — `GRAFFITICODE_CREDENTIALS` (graffiticode, API data) and `GRAFFITICODE_APP_CREDENTIALS` (graffiticode-app, console data). Catalog, flags, and per-script operational caveats: skill `admin-scripts`.

Two prohibitions that outlive any one script:
- **Never change the value of an existing secret key version.** Old ciphertext persists forever and only decrypts with the key that wrote it.
- `scripts/set-compiler-secret.sh` propagates `GRAFFITICODE_SECRET_KEY` to a compiler service. **That key MUST NEVER CHANGE** — the script refuses to overwrite an existing target key with a different value.

**Secrets & credentials:** account credentials are split across a public `credentials` doc and an encrypted `secrets` doc under `users/{uid}/settings`; the **identical keyring** must be present on the console runtime AND every `l0NNN` compiler service (console encrypts, compilers decrypt). Full contract (ciphertext formats, env vars, rotation procedure): `docs/secret-encryption.md`.

## Local Development

1. Configure `.env.local` with API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, Firebase config, etc.)
2. `npm run dev`
3. Run Graffiticode API/auth servers separately (see graffiticode/graffiticode repo)

**Anthropic key split — dev vs prod.** Two org API keys: `graffiticode-console` is **production only** (plain env var on the `console` Cloud Run service — do NOT put it in `.env.local`), and `graffiticode-console-dev` is what `.env.local`'s `ANTHROPIC_API_KEY` holds, so `npm run dev` spends there. Anything measuring **production** spend must read `ANTHROPIC_CONSOLE_KEY_IDS` rather than resolving `ANTHROPIC_API_KEY`. Details and traps: skill `admin-scripts`.
