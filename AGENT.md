# AGENT.md - Graffiticode Console Development Guide

## Build/Lint/Test Commands
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint errors
- `npm run storybook` - Run Storybook (port 6006)
- **No test runner configured** - test files exist (*.spec.js) but no npm test script

## Architecture
- **Next.js 15 + React 18** web application with GraphQL API at `/api`
- **Key directories**: `src/pages/` (routing), `src/components/` (React components), `src/hooks/` (custom hooks), `src/lib/` (core utilities)
- **Authentication**: Firebase Auth + Ethereum wallet (SIWE protocol)
- **State management**: React hooks + SWR for server state + Context providers
- **External APIs**: Calls to `api.graffiticode.org` for language compilation services
- **Database**: Firestore for task storage, local storage for UI state

## Code Style Guidelines
- **Files**: Use `.jsx` for React components, `.tsx` for TypeScript, `.js` for utilities
- **Naming**: kebab-case for files, camelCase for functions/variables, PascalCase for components
- **Imports**: External libraries first, then internal imports, then relative imports
- **Styling**: TailwindCSS classes preferred, responsive design with `sm:`/`lg:` prefixes
- **Components**: Functional components with hooks, custom hooks for shared logic
- **Error handling**: Custom HttpError classes with status codes, defensive programming patterns
