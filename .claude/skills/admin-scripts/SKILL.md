---
name: admin-scripts
description: Catalog of scripts/ admin tools (credentials, cost-per-item, embeddings, secret propagation) and the Anthropic dev-vs-prod API key split. Read before running or modifying anything in scripts/, or when measuring AI cost.
---

# Admin scripts

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
- `npx tsx scripts/cost-per-item.ts [--period day|week|month] [--from/--to] [--key <name|id>] [--exclude-trial] [--check] [--output f.html] [--json]` - **Average AI cost to produce one item.** Cost comes from the *provider* APIs, not our own telemetry: the Firestore `ai_generation` records omit cache tokens and never saw an embedding, so anything derived from them understates the bill. Anthropic's `usage_report/messages` (Admin API, `ANTHROPIC_ADMIN_KEY`) gives the full cache breakdown per model, priced by `usdCostFromReport()` in `src/lib/model-pricing.ts`; the denominator is `usage` docs with `type=='item_created'`. Three things to know: **(1)** spend is scoped by API key, so the figure is a true blended all-in average and cannot be split per language or per item; **(2)** the key matters — production runs on `graffiticode-console` while `.env.local`'s `ANTHROPIC_API_KEY` may be a different local key, so set `ANTHROPIC_CONSOLE_KEY_IDS=graffiticode-console` or pass `--key`, and use `--check` to see what share of Anthropic's actual bill the selected keys account for; **(3)** the usage report lags by hours, so a window covering today reports \$0 against real items — the script warns, but end the window at yesterday for a settled number. OpenAI embedding spend needs `OPENAI_ADMIN_KEY` (an `sk-admin-…` org key; a project key gets a 403) and is excluded-with-a-warning when absent.
  - `--lang <id>` (repeatable; `0176`, `L0176`, `176` all resolve) scopes to one language or a family — `--lang 0158 --lang 0176` pools the Learnosity dialects. It **implies `--per-item` and suppresses the blended figure**, because provider-reported spend covers the whole API key and cannot be split by language; only the attributed path can answer per-language. The free-plan trial counter has no language dimension, so trial counts read 0 under `--lang` rather than being reported as a subset of a different population.
  - `--per-item` reads the **attributable** view instead: each `ai_generation` usage record now carries `tokens.cacheCreation`/`tokens.cacheRead`, a `cost.usd` priced at write time, and two join keys — `itemId` (set on an edit) and `generatedTaskId` (the join on a fresh create, where generation runs *before* the item exists; `users/{uid}/versions` stores both `taskId` and `itemId`). Records written before this shipped have `cost.total: 0` and no task id, and are reported as `legacy` rather than silently priced at zero. Because these counts come from the SSE stream rather than the provider, the output prints a **recorded-vs-provider ratio** as a live check on the stream accounting — far from 100% means our counting is off, not the bill.
- `npx tsx scripts/update-embeddings.ts` - Update training example embeddings
- `npx tsx scripts/download-training-examples.ts` - Download training examples to markdown
- `npx tsx scripts/upgrade-basis-and-deploy.ts` - Upgrade @graffiticode/basis in all language repos and deploy
  - `--lang 0158 0166` - Only upgrade specific languages
  - `--no-force` - Skip deploy if basis is already up to date
  - `--verbose` - Stream build output to terminal
- `./scripts/set-free-plan-secrets.sh` - Push `FREE_PLAN_API_KEY` and `FREE_PLAN_NAMESPACE_SALT` from `.env.local` into Secret Manager and remount on the `console` Cloud Run service. Re-running rotates (creates a new secret version) and rolls a new revision. Rotating the salt invalidates active free-plan namespaces.
- `./scripts/set-compiler-secret.sh <lang>` - Propagate `GRAFFITICODE_SECRET_KEY` from the console secret (Secret Manager, project `graffiticode-app`) to a language/compiler Cloud Run service (e.g. `l0166`) in project `graffiticode`, mounting the identical key. Accepts `l0166`/`L0166`/`0166`. **The key MUST NEVER CHANGE** — the script refuses to overwrite an existing target key with a different value.

## Anthropic key split — dev vs prod (set up 2026-07-28)

Two org API keys, and which one you spend on is what makes per-item cost measurable:
- **`graffiticode-console`** (`apikey_01HXtW4…`) — **production only.** Carried as a plain env var on the `console` Cloud Run service. Do NOT put it in `.env.local`.
- **`graffiticode-console-dev`** (`apikey_01N4UM…`) — local dev. This is what `.env.local`'s `ANTHROPIC_API_KEY` holds, so `npm run dev` spends here.

`.env.local` previously held the *production* key, so every local generation billed against production and inflated `scripts/cost-per-item.ts` — on a light week, developer testing could outweigh real traffic. Anything that must measure **production** spend reads `ANTHROPIC_CONSOLE_KEY_IDS=graffiticode-console` from `.env.local` rather than resolving `ANTHROPIC_API_KEY` (which now names the dev key); `cost-per-item.ts` and `fetch-daily-usage.ts` both honour it. Two traps worth knowing: a shell-exported `ANTHROPIC_API_KEY` **shadows `.env.local`** in every script using the guarded env loader (`if (!(key in process.env))`) — `fetch-daily-usage.ts` uses an overwriting loader and does not — and the Admin API has **no create-key endpoint**, so minting a key is Console-only (rename/disable are scriptable via `POST /v1/organizations/api_keys/{id}`).

## Deploy config

`cloudrun-env-vars.yaml` is **dead** — nothing references it and its `ANTHROPIC_API_KEY` is a stale third key (`l0156-claude-key`). Deploys set env vars via `--update-env-vars` in `cloudbuild.yaml` and otherwise leave the service's existing vars alone. Don't revive that file without reconciling it against the live service.
