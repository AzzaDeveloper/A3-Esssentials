# Engineering Guide

Concise, code-focused guide for building the app: a team task and note tool with a live moodboard and mood-aware assignment. This document only covers implementation details relevant to coding.

## Tech Stack

- Next.js App Router (`src/app`), `next@15.5.2`
- React 19, TypeScript 5
- Tailwind CSS v4 (+ `cn` util)
- shadcn UI (optional scaffolding)
- Firebase Web SDK v12 (Auth, Firestore)
- ESLint 9 (Next config), Jest 30 (optional tests)

## Project Structure

- App root: `src/app/layout.tsx`, `src/app/page.tsx`
- Styles: `src/app/globals.css`
- Libs: `src/lib/*` (e.g., `src/lib/utils.ts`, `src/lib/firebase.ts`, `src/lib/types.ts`)
- API routes: `src/app/api/<name>/route.ts`
- Components: `src/components/**` and `src/components/ui/**` (shadcn)

## Coding Conventions

- Prefer Server Components; add `"use client"` only for interactive UI.
- Fetch data in Server Components or Server Actions; keep Client components presentational.
- Use `cn()` from `src/lib/utils.ts` for Tailwind class composition.
- Centralize types in `src/lib/types.ts` and reuse across UI, API, and actions.
- Run `npm run lint` to keep code consistent.

## Minimal Types

Create `src/lib/types.ts`:

```ts
export type Facet = "focus" | "energy" | "social" | "calm";

export interface MoodProfile {
  memberId: string;
  facets: Record<Facet, number>; // -1..1
  confidence?: Partial<Record<Facet, number>>;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  priority?: "low" | "med" | "high";
  assigneeId?: string | null;
}

export interface AssignmentScore {
  fit: number;
  load: number;
  mood_fit: number;
  fairness: number;
}
```

## Firebase Integration

Add `src/lib/firebase.ts` (modular init):

```ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function firebase() {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FB_MSG_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
    });
  }
  db ||= getFirestore(app);
  auth ||= getAuth(app);
  return { app, db, auth };
}
```

Environment: set `NEXT_PUBLIC_FB_*` values in your runtime.

## API Surface (initial)

- `src/app/api/mood/route.ts`
  - `GET`: list recent mood signals (placeholder OK)
  - `POST`: accept mood signals and persist to Firestore

- `src/app/api/tasks/route.ts`
  - `GET`: list tasks
  - `POST`: create task

- `src/app/api/assignments/propose/route.ts`
  - `POST`: compute and store a proposed assignment for a task

Example stub:

```ts
// src/app/api/mood/route.ts
import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ ok: true, items: [] }); }
export async function POST(req: Request) { const body = await req.json(); return NextResponse.json({ ok: true, received: body }); }
```

## Pages & Components

- Moodboard: `src/app/moodboard/page.tsx` (Server Component)
  - Shows aggregate mood and recent changes; add filters (timeframe/team)
- Tasks: `src/app/tasks/page.tsx` (Server Component)
  - Lists tasks; link to details/assignment actions
- UI primitives via shadcn: `button`, `card`, `badge` in `src/components/ui/*`
- TaskCard: `src/components/task-card.tsx` (Client) displaying scores and actions

## Server Actions

- Create `src/app/(actions)/assign.ts` with `proposeAssignment(taskId: string)`
- Actions run on server; call from Client components via form/actions APIs

## Tailwind + shadcn

- Use `cn()` to merge classes.
- Scaffold components as needed:
  - `npx shadcn@latest add button`
  - `npx shadcn@latest add card`

## Testing

- Add Jest config when ready; begin with pure functions (e.g., scoring in `src/lib/*`).

## Dev Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`

## Optional Dev Tools

- MCP servers configured in `.codex/config.toml` can scaffold UI (shadcn) or integrate with Firebase tooling during development. Not required at runtime.

## AI Coding Assist (Tech-Aware)

This section equips coding agents with stack-specific guidance for this repo.

### Tech Stack Summary

- Next.js App Router: `src/app` with Server and Client Components. `next@15.5.2`.
- TypeScript: strict patterns encouraged. `typescript@^5`.
- React 19: concurrent features; use `use client` where needed.
- Tailwind CSS v4: global styles in `src/app/globals.css`. Utility helper `cn` in `src/lib/utils.ts`.
- shadcn UI: CLI available for component scaffolding; design tokens in `components.json`.
- Firebase Web SDK v12: prefer modular imports; initialize once.
- ESLint 9 + next config: `eslint.config.mjs`.
- Jest 30: listed; minimal config not yet present.

### Repo Layout & Conventions

- App router root: `src/app/layout.tsx`, `src/app/page.tsx`.
- Styles: `src/app/globals.css` (Tailwind base/utilities expected via PostCSS).
- Utils: `src/lib/utils.ts` exports `cn` merger.
- Add libs: place shared code in `src/lib/*` (e.g., `src/lib/firebase.ts`).
- Routes: API route handlers in `src/app/api/<name>/route.ts`.
- Server Actions: co-locate with component or in `src/app/(actions)/*.ts`. Mark callers as Server Components by default.

### Coding Guardrails

- Prefer Server Components by default. Add `"use client"` only for interactive UI.
- Keep UI pure; move data fetching to Server Components or Server Actions.
- Tailwind: use `cn()` to compose classes; avoid dynamic string concatenation.
- Types: export interfaces from `src/lib/types.ts` (create as needed) and reuse across UI, actions, and API routes.
- Lint/format: run `npm run lint` before commits. Align with `eslint.config.mjs`.

### Firebase Integration (scaffold)

- Create `src/lib/firebase.ts` with modular init. Example:
```ts
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

export function firebase() {
  if (!getApps().length) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FB_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FB_MSG_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FB_APP_ID!,
    });
  }
  db ||= getFirestore(app);
  auth ||= getAuth(app);
  return { app, db, auth };
}
```

- Env: add the required `NEXT_PUBLIC_FB_*` values via your runtime secret system.

### Example Feature Recipes

- Moodboard page
  - Create `src/app/moodboard/page.tsx` as a Server Component.
  - Fetch aggregate moods (placeholder) and render cards using shadcn `Card`.
  - Add filters: timeframe, team, confidence threshold.

- Mood Signal API
  - Add `src/app/api/mood/route.ts` with `POST` to accept signals and `GET` to list recent.
  - Validate payloads; redact PII; persist via Firebase (collection `mood_signals`).

- Task Card UI
  - Add `src/components/task-card.tsx` (Client for interactions like accept/decline).
  - Props: task, scores (fit, load, mood_fit), rationale.
  - Actions: accept/decline via Server Actions imported into Client wrapper.

- Assignment Server Action
  - Create `src/app/(actions)/assign.ts` exporting `proposeAssignment(taskId: string)`.
  - Reads candidates, computes scores, writes `assignment.proposed` record.

### File Stubs (suggested)

- `src/lib/types.ts`
```ts
export type Facet = "focus" | "energy" | "social" | "calm";
export interface MoodProfile { memberId: string; facets: Record<Facet, number>; confidence: Partial<Record<Facet, number>>; updatedAt: string }
export interface Task { id: string; title: string; description?: string; tags?: string[]; priority?: "low"|"med"|"high"; assigneeId?: string | null }
export interface AssignmentScore { fit: number; load: number; mood_fit: number; fairness: number }
```

- `src/app/api/mood/route.ts`
```ts
import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ ok: true, items: [] }); }
export async function POST(req: Request) { const body = await req.json(); /* validate, store */ return NextResponse.json({ ok: true }); }
```

### Tailwind + shadcn

- Use shadcn to scaffold UI primitives. Examples:
  - Button: `npx shadcn@latest add button`
  - Card: `npx shadcn@latest add card`
- Follow the generated paths (usually `src/components/ui/*`). Import via `@/components/ui/button`.
- Animations: `tw-animate-css` available; prefer subtle motion on mood changes.

### Testing (lightweight start)

- Add `jest.config.ts` with `ts-jest` or ESM config; pair with `@testing-library/react` for components.
- Start with pure functions (e.g., scoring) in `src/lib/*`. Avoid testing framework internals.

### MCP Coding Tools & Recipes

- Servers from `.codex/config.toml`:
  - `context7` (HTTP): external context fetch; add `CONTEXT7_API_KEY` via env.
  - `shadcn` (stdio): UI scaffolding. Recipes: add `button`, `card`, `badge`.
  - `firebase` (stdio): Firestore CRUD via `experimental:mcp` when available.

- Example agent intents:
  - UI Agent: "Scaffold shadcn Card and Badge, then add `src/app/moodboard/page.tsx` rendering sample profiles."
  - Data Agent: "Add `src/lib/firebase.ts`, create `mood_signals` write helper, wire `POST /api/mood`."
  - Quality Agent: "Create `src/lib/score.ts` with assignment scoring and unit tests."

### Prompts the Coding Agent Understands

- "Add a moodboard page with filters and placeholder data using shadcn Card."
- "Implement a Firestore-backed POST /api/mood endpoint with schema validation."
- "Create a reusable TaskCard with accept/decline actions and rationale display."

### Run & Verify

- Dev server: `npm run dev` (Turbopack).
- Build: `npm run build`. Start: `npm run start`.
- Lint: `npm run lint`.
