# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/`: Next.js routes and API handlers (`src/pages/api`).
- `src/components/`: React UI components; `src/hooks/` custom hooks.
- `src/lib/` core services (auth, API, embeddings); `src/utils/` helpers.
- `src/styles/` global and editor styles; `public/` static assets.
- `docs/`, `scripts/` (utility scripts), `training/` (example and data assets).

## Build, Test, and Development Commands
- `npm run dev`: Start the Next.js dev server on `http://localhost:3000`.
- `npm run build`: Create a production build.
- `npm run start`: Serve the production build.
- `npm run lint` / `npm run lint:fix`: Lint (and auto-fix) the codebase.
- `npm run typecheck`: Run TypeScript checks.
- `npm run refresh`: Install local `graffiticode-*.tgz` language packages (dev convenience).
- Requirements: Node `>=18.17`. Environment vars via `.env.local` (see `.env*` for hints).

## Coding Style & Naming Conventions
- Language: TypeScript, React 18, Next.js 15, TailwindCSS for styling.
- Linting: ESLint (extends `next` and `next/core-web-vitals`). Keep code lint‑clean and type‑safe.
- Indentation: 2 spaces; prefer concise, functional components and hooks.
- Naming: PascalCase for React components/files in `src/components` (e.g., `NewAPIKeyDialog.tsx`); camelCase for variables/functions; lower-case file names for pages (e.g., `src/pages/items.tsx`).
- Styling: Prefer Tailwind utility classes; group related classes logically.

## Testing Guidelines
- No formal test runner is configured. When adding complex logic, include lightweight component or unit tests (e.g., Jest + React Testing Library) in the PR if feasible.
- At minimum, ensure `npm run lint` and `npm run typecheck` pass and exercise critical paths manually.

## Commit & Pull Request Guidelines
- Commits: Use clear, imperative messages (e.g., "fix: address build error", "feat: add editor timeline"). Keep changes focused.
- PRs: Provide a summary, linked issues, screenshots/GIFs for UI changes, and steps to verify locally.
- Checks: PRs should be lint-clean, type-clean, and build successfully. Note any config or data prerequisites.

## Security & Configuration Tips
- Store secrets in `.env.local` (do not commit). Typical keys: NextAuth secret/URL, Stripe keys, provider credentials. Client-side Firebase config is embedded; server credentials must remain private.
- Avoid logging secrets; scrub PII in debug output.
