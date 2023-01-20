# Graffiticode APP

## Development

1. Start firebase emulators (_NOTE_: you only to do this once per GCP project).

```bash
npx firebase emulators:start
```

1. Run GC App (in another terminal)
The sample environment uses local instances of the GC API and Auth applications.

```bash
cp .env.delocal.sample .env.local
npm run dev
```
