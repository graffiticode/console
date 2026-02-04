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
- Secondary: Google OAuth (requires linked Ethereum account)
- Auth hook: `useGraffiticodeAuth` in `src/hooks/use-graffiticode-auth.tsx`

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

## Local Development

1. Configure `.env.local` with API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, Firebase config, etc.)
2. `npm run dev`
3. Run Graffiticode API/auth servers separately (see graffiticode/graffiticode repo)
