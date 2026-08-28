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

**`get_spec` model (`spec` mode):** spec generation is the inverse direction and has its own tier, read from the same `MODEL_PRIORITY` table (`src/lib/model-priority.ts`) as code-gen routing — `{ spec: <tier> }` on a language's entry, defaulting to **fast/Haiku**. Tier only: spec-gen calls the Anthropic Messages API directly, so family orderings don't reach it. Raise it for a dialect whose spec-directive asks for something other than verbalize-the-content (L0177's recipe: `{ spec: "balanced" }`), since `assertCoverage` only checks that source strings survive and cannot see a wrong recipe. `SPEC_MODEL` overrides everything as the no-deploy hatch.

**Authentication:** Ethereum wallet sign-in (SIWE) is primary; email magic-link via Privy derives an embedded wallet that signs the same SIWE nonce, so **the wallet must be reused, never re-created** (a fresh one changes the uid). Google OAuth is account-linking only, never a sign-in method. Server-side `authenticate()` accepts a Firebase ID token OR an api key, but **api.graffiticode.org accepts only Firebase ID tokens** — convert via `getCredentialsForApiKey` before forwarding. Details: skill `auth-and-signin`.

**Free-plan tier (no-signin via MCP):** anonymous MCP sessions authenticated by `X-Free-Plan-Session`, metered in **items** (not dollars or compiles), items tagged `freePlan`/`sessionNamespace`/`expiresAt` (48h TTL). `sessionNamespace` means **workspace**, not "the session that created this" — a mutation on an existing item adopts its workspace. Browser console UI always requires real sign-in. Language scope (`freePlan?` in `src/lib/languages.ts`) ships inert. Details: skill `free-plan-and-claim`; runbook `docs/free-plan-attested-sessions.md`.

**Trial-claim flow (`/claim?token=<jwt>`) and the connect step:** the **console** — not the MCP server — mints the claim JWT, because only the console knows the effective (post-adoption) workspace. `claimFreePlanSession(token)` copies the namespace's items into the signed-in user's collection; claiming **copies rather than moves**, so `/claim` must then walk the user through connecting their agent or it keeps editing the anonymous originals. Details: skill `free-plan-and-claim`.

**Funnel events + walls (`src/lib/funnel-events.ts`):** one structured JSON line per lifecycle event to stdout → Cloud Logging; console-side twin of `graffiticode-mcp-server/src/events.ts`. `session` is the join key across all emitters. A **`wall_hit`** is a request refused by a limit (eight kinds) — free-plan walls emit from inside the `FreePlanError` builders, paid walls from the gate in `resolvers.ts`. Aggregated by ONE path (`src/lib/funnel-digest.ts`) feeding three surfaces: hourly SMS, signed `/r/<token>` report page, and `scripts/funnel-report.ts`. Details: skill `funnel-instrumentation`.

**English-only requests (`NON_ENGLISH_GATE`):** the generation stack is English end to end, and a non-English prompt degrades it *silently* — retrieval's keyword half is substring matching over an all-English corpus, so a Cyrillic query zeroes 30% of the ranking signal and empty retrieval is not an error. GUARDRAIL 0 in `generate-for-request.ts` classifies the request (`src/lib/prompt-language.ts`, deterministic, no LLM) and refuses it with an actionable message. It runs on **creates and updates** (unlike the `!currentSrc`-gated scope gate) and is fed `extractSearchQuery(prompt)` so it judges the latest turn — the same text RAG embeds. Only the **instruction** must be English; non-English **content** inside an item is supported and deliberately still passes. `shadow` (default) measures without refusing, `enforce` refuses, `off` disables. Demand is reported as the `non_english_request` funnel event, not the wall — skill `funnel-instrumentation`.

**Privacy contract (applies to every emitter, no exceptions):** never log prompts, item source, or free text (only lengths); never log raw session uuids, tokens, emails, or wallet addresses; never log the client IP.

**Item `app` tag:** items are tagged with the source surface (`'console'`, `'mcp'`, `'front'`) at write time. The `/items` page filters by this tag — switch via the App selector chip in the header. MCP-created items default to `app: 'mcp'` and are invisible in the default Console view; switch to MCP to see them.

**Item version history (`users/{uid}/versions`):** every content state of an item is recorded as a flat, append-only, **pointer-only** doc `{itemId}__{taskId}` via `recordVersion()`; writes are create-if-absent, never set/merge (merging would overwrite a version's original `createdAt`/`source`). Read via the `taskVersions` query, which backs `/tasks`. History does **not** cross accounts: share/claim start at v1. Details: skill `item-version-history`.

**`/api/compile` proxy:** browser-side compile (`src/utils/swr/fetchers.ts compile()`) goes through a Next.js API route proxy at `src/pages/api/compile.ts` rather than calling api.graffiticode.org directly. The proxy handles api-key → ID-token exchange so the browser never needs to hold a Firebase ID token for downstream calls (and free-plan callers don't need to expose FREE_PLAN_API_KEY).

**Item-based pricing & metering:** billing meters **successful items created per month** — iteration, reads, and compiles are free. `src/lib/plans-config.ts` (`PLANS`) is the single source of truth for tiers, allowances, overage rates, and Stripe price-id mappings; **never hardcode any of them** (that duplication was already removed once). Counting happens in `recordBillableItem()`, gating in `checkItemCreateAllowed()`. **Bronze (`demo`, ex-"Free") is a two-state tier:** hard-capped at 50 items until the customer enrolls in pay-as-you-go, then metered at $0.20/item up to a required spend cap. Payment details are captured at exactly two moments — the 50-item wall and setting a cap — never at signup. Branch on `isHardCappedFor(plan, subscription)`, never bare `isHardCapped(plan)`. Details: skill `item-pricing`; full reference `docs/item-based-pricing.md`.

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
