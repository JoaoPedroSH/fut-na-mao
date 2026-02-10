# Pelada Manager

## Overview

Pelada Manager is a pickup soccer (futsal) match management app. It lets users register players, configure match settings (team size, duration, win conditions), randomly assign teams, run live matches with a scoreboard and countdown timer, and log match results. The app follows a classic full-stack TypeScript architecture with a React frontend and Express backend, backed by PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with two main routes: `/` (Lobby) and `/match` (Match)
- **State Management**: 
  - Server state via TanStack React Query (players and matches fetched from API)
  - Local game session state via a custom `useGameState` hook that syncs to `localStorage` (team assignments, scores, timer, phase)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS and CSS variables for theming
- **Animations**: Framer Motion for interactive elements (score transitions, button effects), canvas-confetti for win celebrations
- **Styling**: Tailwind CSS with a custom sporty green/yellow/blue theme, supports dark mode via `.dark` class. Custom fonts: Teko (display), Inter (body), JetBrains Mono (monospace)
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

### Backend

- **Framework**: Express.js on Node with TypeScript (run via `tsx` in dev)
- **API Design**: RESTful JSON API under `/api/` prefix. Route definitions are shared between client and server via `shared/routes.ts`, which contains path strings, HTTP methods, Zod input/output schemas
- **Key endpoints**:
  - `GET/POST /api/players` — list and create players
  - `DELETE /api/players/:id` — remove a player
  - `GET/POST /api/matches` — list and create match logs
- **Validation**: Zod schemas generated from Drizzle table definitions via `drizzle-zod`, used for both server-side validation and client-side type safety
- **Build**: Custom build script using Vite for client and esbuild for server, outputs to `dist/`

### Shared Layer (`shared/`)

- `schema.ts` — Drizzle ORM table definitions and Zod insert schemas. Two tables: `players` and `matches`
- `routes.ts` — API contract definitions with paths, methods, input schemas, and response schemas. Exports a `buildUrl` helper for parameterized routes

### Database

- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Schema management**: `drizzle-kit push` for schema migrations (no migration files committed, uses push strategy)
- **Tables**:
  - `players`: id (serial), name (text), isActive (boolean), createdAt (timestamp)
  - `matches`: id (serial), teamA (jsonb string[]), teamB (jsonb string[]), scoreA (int), scoreB (int), durationSeconds (int), winner (text: 'A'|'B'|'DRAW'), createdAt (timestamp)
- **Storage pattern**: `IStorage` interface in `server/storage.ts` with `DatabaseStorage` implementation

### Dev vs Production

- **Development**: Vite dev server with HMR proxied through Express, uses `server/vite.ts` middleware setup
- **Production**: Client built to `dist/public/`, server bundled to `dist/index.cjs`, served as static files with SPA fallback

## External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` env var using `pg` Pool
- **Replit plugins** — `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` (dev only)
- **Google Fonts** — Teko, Inter, JetBrains Mono, DM Sans, Fira Code, Geist Mono loaded via CDN
- **No authentication** — The app currently has no auth; all endpoints are public
- **No external APIs** — Purely self-contained CRUD application