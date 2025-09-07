## Task Buddy

Team task management and note‑taking with a live moodboard. The app focuses on natural task capture and mood‑aware assignment to keep teams coordinated and balanced.

## Features

- Natural task capture from notes (planned)
- Moodboard showing team focus/energy/social/calm (planned)
- Mood‑aware task assignment (planned)
- Tasks and basic pages scaffolded with Next.js

## Tech Stack

- Next.js App Router (`next@15`) + React 19 + TypeScript 5
- Tailwind CSS v4, shadcn UI components
- Firebase Web SDK v12 (Auth, Firestore)
- ESLint 9, Jest 30 (for unit tests)

## AI & Collaboration

- Codex CLI for AI coding assistance
- Model Context Protocol (MCP) servers configured in `.codex/config.toml`:
  - `context7` (HTTP) for external context
  - `shadcn` (stdio) for UI scaffolding
  - `firebase` (stdio) for Firebase tooling
- See `AGENTS.MD` for the engineering guide and coding recipes

## Development

Run the dev server:

```bash
npm run dev
```

Build and start:

```bash
npm run build && npm start
```

Lint:

```bash
npm run lint
```

## Environment

If using Firebase, set the following (public) env vars:

```
NEXT_PUBLIC_FB_API_KEY=
NEXT_PUBLIC_FB_AUTH_DOMAIN=
NEXT_PUBLIC_FB_PROJECT_ID=
NEXT_PUBLIC_FB_STORAGE_BUCKET=
NEXT_PUBLIC_FB_MSG_SENDER_ID=
NEXT_PUBLIC_FB_APP_ID=
```

## Useful Paths

- App shell: `src/app/layout.tsx`, `src/app/page.tsx`
- Styles: `src/app/globals.css`
- Utils: `src/lib/utils.ts`
- Engineering guide: `AGENTS.MD`
- MCP config: `.codex/config.toml`
