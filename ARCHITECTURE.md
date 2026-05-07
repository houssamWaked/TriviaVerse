# TriviaVerse Architecture

## 1) Project summary
TriviaVerse is a full-stack trivia game platform with multiple play modes (Story, Classic, Blitz, Millionaire, Custom Quizzes) plus social features (friends, duels) and an admin dashboard. It consists of a TypeScript/Express API backed by Supabase (Postgres), a NestJS GraphQL backend for migrated public reads, and a React (Vite) client that talks to the APIs over HTTP and receives realtime updates via Socket.IO.

## 2) Tech stack
- **Languages**
  - TypeScript (API + client)
  - SQL (database migrations in `api/sql/`)
- **Backend (`api/`)**
  - Express 5 (`express`)
  - Socket.IO server (`socket.io`)
  - Supabase client (`@supabase/supabase-js`)
  - Auth/security: JWT (`jsonwebtoken`), bcrypt (`bcryptjs`), Helmet (`helmet`), CORS (`cors`), rate limiting (`express-rate-limit`), cookies (`cookie-parser`)
  - Validation: `express-validator`
  - Runtime/dev: `tsx`, `typescript`, `prettier`
  - Tests: Node test runner + `supertest`
- **Frontend (`client/Trivia/`)**
  - React 19 + ReactDOM
  - Vite
  - MUI v7 (`@mui/material`, `@mui/icons-material`)
  - Emotion (`@emotion/react`, `@emotion/styled`)
  - Redux Toolkit + React Redux
  - HTTP: Axios
  - Socket.IO client (`socket.io-client`)
  - Linting: ESLint + TypeScript ESLint
- **Infrastructure / tooling**
  - Environment config via `.env` / `.env.example`
  - Optional deployment hints: `client/Trivia/vercel.json`

## 3) Module/component breakdown

### Backend (`api/`)
- **Entrypoint**
  - `api/index.ts`: creates an HTTP server, mounts Express app, initializes Socket.IO.
- **HTTP composition root**
  - `api/src/app.ts`: wires middleware, creates repositories/services/controllers (manual DI), mounts routes under `/api/*`, and registers 404 + error handler.
- **Routing layer**
  - `api/src/routes/*Route.ts`: Express routers per feature area (auth, public, sessions, story, classic, blitz, duels, friends, admin, etc.).
- **Controllers**
  - `api/src/controllers/*Controller.ts`: HTTP adapters that translate Express `req/res` into service calls and return JSON.
- **Services**
  - `api/src/services/*Service.ts`: business logic per domain (auth, sessions/gameplay, story/classic progression, matchmaking, duels, leaderboards, admin).
- **Repositories**
  - `api/src/domain/repositories/*Repository.ts`: data access wrappers around Supabase tables/views.
- **Domain models / DTOs**
  - `api/src/domain/entity/*`: entity classes that normalize DB rows.
  - `api/src/domain/dto/*`: DTO classes returned to the client (safe shapes).
- **Middleware**
  - `api/src/middlewares/*`: auth/authorization, request validation, error handling, API protection.
- **Realtime**
  - `api/src/socket.ts`: Socket.IO server setup, auth via JWT, and helpers to emit user-scoped events (`duel:*`, `session:*`, `friends:*`).
- **Database migrations**
  - `api/sql/*.sql`: schema and feature migrations (leaderboards, pools, duels, reports/bans, etc.).

### GraphQL Backend (`api-nest/`)
- **Entrypoint**
  - `api-nest/src/main.ts`: starts the Nest app on `API_NEST_PORT` and exposes `/graphql`.
- **App module**
  - `api-nest/src/app.module.ts`: configures Apollo GraphQL and imports feature modules.
- **Database**
  - `api-nest/src/database/*`: creates the Supabase client for GraphQL services.
- **Feature modules**
  - `auth/`: `login` mutation and `me` query.
  - `health/`: `health` query.
  - `category/`: `publicCategories` and `categoryStats`.
  - `public/`: `homeMetrics` and `leaderboard`.
  - `quiz/`: discover/search, public quiz details, ratings, quiz leaderboard, and `rateQuiz`.
  - `users/`: current-user profile query.

### Frontend (`client/Trivia/`)
- **Entrypoint**
  - `src/main.tsx`: mounts React app with MUI theme.
- **App shell + routing**
  - `src/App.tsx`: hash-based routing, auth modal/session bootstrap, global realtime subscriptions, and top-level page switching.
- **Pages**
  - `src/Pages/*`: feature screens (Home, Story, Classic, Blitz, Millionaire, Create Quiz, Discover, PlaySession, Friends, Profile, Admin, etc.).
- **Components**
  - `src/Components/*` and `src/Cards/*`: reusable UI pieces, admin dashboards, session rendering, etc.
- **API client**
  - `src/api/*`: Axios and GraphQL client wrappers, token/current-user stores, endpoint definitions, and Socket.IO client wiring.
- **Redux store**
  - `src/store/*`: Redux Toolkit store plus `auth`, `global`, `discover`, `leaderboard`, and `profile` slices.
- **Styling**
  - `src/Styles/*` + MUI theme in `src/theme.ts`.
- **Utilities**
  - `src/utils/*`: caching, cookies/consent, error formatting, guest progress persistence, etc.

## 4) System diagram (ASCII)

```
                   +-----------------------------+
                   |      React Client (Vite)    |
                   |  - Pages / Components / MUI |
                   |  - Axios + GraphQL clients  |
                   |  - Redux Toolkit store      |
                   |  - socket.io-client         |
                   +--------------+--------------+
                                  |
                     HTTP (JSON)  |   WebSocket (Socket.IO)
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
 +------+-----------------------+            +--------------+--------------+
 | NestJS GraphQL (`api-nest`)  |            |     Express API (Node)      |
 | - Resolvers -> Services      |            |  - Routes -> Controllers    |
 | - Public migrated reads      |            |  - Gameplay/Auth/Realtime   |
 +--------------+---------------+            +--------------+--------------+
                | Supabase JS                                 | Supabase JS
                +--------------------------+------------------+
                                           |
                   +-----------------------v-----+
                   |      Supabase (Postgres)    |
                   |  - tables + SQL migrations  |
                   +-----------------------------+
```

## 5) Data flow example (end-to-end)

### Example: “Answer a question in a session”
- **Client**
  - `client/Trivia/src/Pages/PlaySession.tsx` (and PlaySession components) calls a gameplay API method (via `src/api/gameplayApi.ts` / `src/api/api.ts`) to submit an answer.
  - Request goes to `POST /api/public/sessions/:session_id/answer` (for public session flow) or the protected sessions routes depending on mode/user.
- **API routing**
  - `api/src/app.ts` mounts the sessions router under `/api/public/sessions` (and protected `/api/*` variants).
  - The sessions router calls into `SessionsController.answer`.
- **Controller**
  - `api/src/controllers/SessionsController.ts` extracts `session_id`, uses `req.user?.id` when present, calls `SessionService.submitAnswer(...)`.
  - After a successful answer, it emits `session:changed` via `emitSessionChanged(...)` so the client can refresh or update UI.
- **Service**
  - `api/src/services/SessionService.ts` applies mode-specific rules (e.g., Blitz timers/strikes, Millionaire lifelines/prizes) and persists the answer via repositories.
  - For some modes, it uses `sessionCache` for fast in-memory progression (especially for guest sessions).
- **Repository / DB**
  - Repositories write to Supabase/Postgres (answers, session status, leaderboards, XP, progress tables).
- **Realtime**
  - `api/src/socket.ts` delivers the `session:changed` event to the authenticated user’s room (`user:<id>`).
- **Client update**
  - The client’s realtime layer (`src/api/ClientRealtimeSync.tsx` + `src/api/realtimeEvents.ts`) receives the event and refreshes session state as needed.

## 6) Key design decisions
- **Manual DI in `api/src/app.ts`**: repositories/services/controllers are constructed explicitly in one place for clarity and easy wiring.
- **Layering convention**: `routes` → `controllers` → `services` → `repositories` → Supabase; DTOs/entities isolate DB shape from client shape.
- **Hybrid session state**: an in-memory `SessionCache` accelerates gameplay (especially guest flows) while still supporting persisted sessions for logged-in users.
- **Realtime user rooms**: Socket.IO joins users into `user:<id>` rooms after JWT verification to enable targeted updates (duels, sessions, friends).
- **Prod-safe auth cookies**: refresh tokens are stored as httpOnly cookies with configurable `sameSite/secure/domain` to support same-origin or proxied deployments.
- **Incremental GraphQL migration**: public read-only views use Nest GraphQL first, with REST fallback in the frontend so gameplay and auth stay stable during the migration.
- **Redux by feature**: shared state is kept in small slices where it helps explain and reuse state, without moving every local component state into Redux.

