# TriviaVerse
> Full-stack trivia platform with multiple play modes, duels, friends, and an admin dashboard.

## Overview
TriviaVerse is a TypeScript monorepo containing an Express + Supabase backend and a React (Vite) frontend. Players can browse quizzes, play sessions in different modes (including Story/Classic/Blitz/Millionaire), track progress, and receive realtime updates via Socket.IO.

## Features
- Multiple gameplay modes: **Story**, **Classic**, **Blitz**, **Millionaire**, and **Custom** quizzes
- Account system with **JWT access tokens** + **refresh cookie** sessions
- **Email verification** flow (optional provider-backed delivery, dev fallback)
- Social: **friends** and **duels** (with realtime notifications)
- **Leaderboards** (mode-specific + global)
- Admin tooling for managing pools/questions/content

## Tech Stack
- **Backend**: Node.js, TypeScript, Express 5, Socket.IO, Supabase JS, JWT, bcrypt, Helmet, CORS, express-validator
- **Frontend**: React 19, Vite, MUI, Emotion, Axios, Socket.IO client
- **DB**: Postgres via Supabase, SQL migrations in `api/sql/`
- **Tooling**: ESLint (client), Prettier (api), TypeScript, TSX, Node test runner + Supertest (api)

## Project Structure
```
TriviaVerse/
  api/                         # Express + Supabase backend
    index.ts                   # HTTP server + socket initialization
    src/
      app.ts                   # Composition root: middleware + DI + routers
      controllers/             # HTTP controllers (req/res -> service calls)
      services/                # Business logic per feature
      domain/
        entity/                # Domain entities (normalized DB rows)
        dto/                   # DTOs returned to clients
        repositories/          # Supabase data access layer
      routes/                  # Express routers per module
      middlewares/             # Auth/validation/error handling
      utils/                   # JWT, email verification, cache, errors
      socket.ts                # Socket.IO server + emit helpers
    sql/                       # Database migrations / schema helpers

  client/Trivia/               # React (Vite) frontend
    index.html
    vite.config.ts
    src/
      main.tsx                 # React entrypoint
      App.tsx                  # App shell + hash routing + auth + realtime
      Pages/                   # Feature pages
      Components/              # Reusable components (incl. Admin & sessions)
      api/                     # API + token/user stores + sockets
      Styles/                  # UI styling (MUI sx/style modules)
      utils/                   # Cache/cookies/errors/guest progress helpers

  ARCHITECTURE.md              # System overview and diagrams
```

## Setup & Installation

### Prerequisites
- Node.js (modern LTS recommended)
- A Supabase project (Postgres) if you want persistence beyond local/dev mocks

### Backend (`api/`)
1. Install dependencies:

```bash
cd api
npm install
```

2. Configure environment:
   - Copy `api/.env.example` → `api/.env` and fill values as needed (Supabase keys, JWT secrets, CORS origins, etc.)

3. Apply SQL migrations (Supabase):
   - Run the SQL files in `api/sql/` against your Supabase database (in order) to enable all features (leaderboards, pools, duels, reports/bans, etc.)

4. Start the API:

```bash
npm start
```

By default the API listens on `PORT=3001`.

### Frontend (`client/Trivia/`)
1. Install dependencies:

```bash
cd client/Trivia
npm install
```

2. Configure environment:
   - Copy `client/Trivia/.env.example` → `client/Trivia/.env`
   - Set `VITE_API_BASE_URL` (defaults to `http://localhost:3001`)

3. Start the dev server:

```bash
npm run dev
```

## Usage
- Open the Vite dev URL shown in the terminal (typically `http://localhost:5173`).
- Create an account (and verify email if enabled) or use guest flows where available.
- Play modes from the home screen, browse quizzes, and check the leaderboard.

## Notes
- **Same-origin recommended in prod**: If hosting client + API separately, consider a reverse proxy/rewrite so `/api/*` stays same-origin for reliable refresh-cookie behavior.
- **Realtime**: Socket.IO authenticates connections using the access token and delivers user-scoped events (session/duel/friends changes).
- **Schema features**: Some repositories include schema-compat logic; if a feature appears “missing,” check that the corresponding SQL migration from `api/sql/` has been applied.

