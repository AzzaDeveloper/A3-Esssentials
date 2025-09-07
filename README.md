## Task Buddy

Team task management and note‑taking with a live moodboard. The app focuses on natural task capture and mood‑aware assignment to keep teams coordinated and balanced.

## Features

-   Natural task capture from notes (planned)
-   Moodboard showing team focus/energy/social/calm (planned)
-   Mood‑aware task assignment (planned)
-   Tasks and basic pages scaffolded with Next.js

## Tech Stack

-   Next.js App Router (`next@15`) + React 19 + TypeScript 5
-   Tailwind CSS v4, shadcn UI components
-   Firebase Web SDK v12 (Auth, Firestore)
-   ESLint 9, Jest 30 (for unit tests)

## AI & Collaboration

-   Codex CLI for AI coding assistance
-   Model Context Protocol (MCP) servers configured in `.codex/config.toml`:
    -   `context7` (HTTP) for external context
    -   `shadcn` (stdio) for UI scaffolding
    -   `firebase` (stdio) for Firebase tooling
-   See `AGENTS.MD` for the engineering guide and coding recipes

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

-   App shell: `src/app/layout.tsx`, `src/app/page.tsx`
-   Styles: `src/app/globals.css`
-   Utils: `src/lib/utils.ts`
-   Engineering guide: `AGENTS.MD`
-   MCP config: `.codex/config.toml`

## Suggested FS

    task-buddy/
    ├── README.md
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── eslint.config.js
    ├── prettier.config.js
    ├── .env.local
    ├── .env.example
    ├── .gitignore
    ├── firebase.json
    ├── firestore.rules
    ├── firestore.indexes.json
    ├── components.json # shadcn/ui config
    │
    ├── public/
    │ ├── favicon.ico
    │ ├── icons/
    │ │ ├── priority-high.svg
    │ │ ├── priority-medium.svg
    │ │ └── priority-low.svg
    │ └── sounds/
    │ └── notification.mp3
    │
    ├── src/
    │ ├── app/
    │ │ ├── layout.tsx
    │ │ ├── page.tsx
    │ │ ├── globals.css
    │ │ ├── loading.tsx
    │ │ ├── error.tsx
    │ │ ├── not-found.tsx
    │ │ │
    │ │ ├── (auth)/
    │ │ │ ├── layout.tsx
    │ │ │ ├── login/
    │ │ │ │ └── page.tsx
    │ │ │ └── register/
    │ │ │ └── page.tsx
    │ │ │
    │ │ ├── (dashboard)/
    │ │ │ ├── layout.tsx
    │ │ │ ├── dashboard/
    │ │ │ │ ├── page.tsx
    │ │ │ │ └── loading.tsx
    │ │ │ ├── projects/
    │ │ │ │ ├── page.tsx
    │ │ │ │ ├── [projectId]/
    │ │ │ │ │ ├── page.tsx
    │ │ │ │ │ └── settings/
    │ │ │ │ │ └── page.tsx
    │ │ │ │ └── new/
    │ │ │ │ └── page.tsx
    │ │ │ └── teams/
    │ │ │ ├── page.tsx
    │ │ │ └── [teamId]/
    │ │ │ ├── page.tsx
    │ │ │ └── members/
    │ │ │ └── page.tsx
    │ │ │
    │ │ └── api/
    │ │ ├── auth/
    │ │ │ └── route.ts
    │ │ ├── tasks/
    │ │ │ ├── route.ts
    │ │ │ └── [taskId]/
    │ │ │ └── route.ts
    │ │ ├── projects/
    │ │ │ ├── route.ts
    │ │ │ └── [projectId]/
    │ │ │ ├── route.ts
    │ │ │ └── tasks/
    │ │ │ └── route.ts
    │ │ └── teams/
    │ │ ├── route.ts
    │ │ └── [teamId]/
    │ │ └── route.ts
    │ │
    │ ├── components/
    │ │ ├── ui/ # Pure shadcn/ui components
    │ │ │ ├── button.tsx
    │ │ │ ├── card.tsx
    │ │ │ ├── input.tsx
    │ │ │ ├── select.tsx
    │ │ │ ├── dialog.tsx
    │ │ │ ├── dropdown-menu.tsx
    │ │ │ ├── avatar.tsx
    │ │ │ ├── badge.tsx
    │ │ │ ├── checkbox.tsx
    │ │ │ ├── toast.tsx
    │ │ │ └── skeleton.tsx
    │ │ │
    │ │ ├── features/
    │ │ │ ├── auth/
    │ │ │ │ ├── LoginForm.tsx
    │ │ │ │ ├── RegisterForm.tsx
    │ │ │ │ └── AuthGuard.tsx
    │ │ │ │
    │ │ │ ├── tasks/
    │ │ │ │ ├── TaskCard.tsx
    │ │ │ │ ├── TaskList.tsx
    │ │ │ │ ├── TaskForm.tsx
    │ │ │ │ ├── TaskFilters.tsx
    │ │ │ │ ├── TaskSearch.tsx
    │ │ │ │ └── DragDropBoard.tsx
    │ │ │ │
    │ │ │ ├── projects/
    │ │ │ │ ├── ProjectCard.tsx
    │ │ │ │ ├── ProjectList.tsx
    │ │ │ │ ├── ProjectForm.tsx
    │ │ │ │ └── ProjectSettings.tsx
    │ │ │ │
    │ │ │ └── teams/
    │ │ │ ├── TeamMemberCard.tsx
    │ │ │ ├── TeamMemberList.tsx
    │ │ │ ├── TeamInviteForm.tsx
    │ │ │ └── TeamSettings.tsx
    │ │ │
    │ │ ├── layout/
    │ │ │ ├── Header.tsx
    │ │ │ ├── Sidebar.tsx
    │ │ │ ├── Navigation.tsx
    │ │ │ ├── Footer.tsx
    │ │ │ └── ThemeProvider.tsx
    │ │ │
    │ │ └── common/
    │ │ ├── LoadingSpinner.tsx
    │ │ ├── ErrorBoundary.tsx
    │ │ ├── EmptyState.tsx
    │ │ ├── ConfirmDialog.tsx
    │ │ └── SearchInput.tsx
    │ │
    │ ├── lib/
    │ │ ├── utils.ts # shadcn/ui utilities + custom utils
    │ │ ├── constants.ts
    │ │ ├── env.ts # Environment validation
    │ │ │
    │ │ ├── firebase/
    │ │ │ ├── config.ts
    │ │ │ ├── auth.ts
    │ │ │ ├── firestore.ts
    │ │ │ ├── storage.ts
    │ │ │ └── admin.ts # Server-side Firebase admin
    │ │ │
    │ │ ├── services/
    │ │ │ ├── auth.service.ts
    │ │ │ ├── task.service.ts
    │ │ │ ├── project.service.ts
    │ │ │ └── team.service.ts
    │ │ │
    │ │ ├── stores/ # State management (Zustand/Jotai)
    │ │ │ ├── auth.store.ts
    │ │ │ ├── task.store.ts
    │ │ │ └── ui.store.ts
    │ │ │
    │ │ ├── validations/ # Zod schemas
    │ │ │ ├── auth.schema.ts
    │ │ │ ├── task.schema.ts
    │ │ │ ├── project.schema.ts
    │ │ │ └── team.schema.ts
    │ │ │
    │ │ └── utils/
    │ │ ├── date.ts
    │ │ ├── string.ts
    │ │ ├── array.ts
    │ │ └── drag-drop.ts
    │ │
    │ ├── hooks/
    │ │ ├── useAuth.ts
    │ │ ├── useTasks.ts
    │ │ ├── useProjects.ts
    │ │ ├── useTeams.ts
    │ │ ├── useDragDrop.ts
    │ │ ├── useLocalStorage.ts
    │ │ ├── useDebounce.ts
    │ │ └── useRealtime.ts
    │ │
    │ ├── types/
    │ │ ├── auth.types.ts
    │ │ ├── task.types.ts
    │ │ ├── project.types.ts
    │ │ ├── team.types.ts
    │ │ ├── api.types.ts
    │ │ └── global.types.ts
    │ │
    │ └── styles/
    │ ├── globals.css
    │ └── components.css
    │
    ├── docs/
    │ ├── README.md
    │ ├── CONTRIBUTING.md
    │ ├── API.md
    │ ├── DEPLOYMENT.md
    │ └── ARCHITECTURE.md
    │
    ├── scripts/
    │ ├── setup.js
    │ ├── migrate.js
    │ ├── seed.js
    │ └── build.js
    │
    └── **tests**/
    ├── setup.ts
    ├── **mocks**/
    │ ├── firebase.ts
    │ └── next-router.ts
    ├── components/
    │ ├── TaskCard.test.tsx
    │ └── ProjectForm.test.tsx
    ├── hooks/
    │ ├── useAuth.test.ts
    │ └── useTasks.test.ts
    ├── lib/
    │ ├── utils.test.ts
    │ └── validations.test.ts
    └── e2e/
    ├── auth.spec.ts
    ├── task-management.spec.ts
    └── collaboration.spec.ts
