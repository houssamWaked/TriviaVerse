# TriviaVerse Frontend

React + Vite frontend for TriviaVerse.

## Development

```bash
npm install
npm run dev
```

## API Usage

The app still uses the Express REST API for gameplay, auth network calls, admin actions, and realtime features.

Public read-only data uses GraphQL first through:

- `src/api/graphqlClient.ts`
- `src/api/graphqlPublicApi.ts`

Migrated reads have REST fallback so the site stays operational if the GraphQL backend is not running.

## Redux

Redux Toolkit lives in `src/store`.

- `authSlice` stores the current user.
- `globalSlice` is reserved for shared global UI state.
- `discoverSlice` stores discover page query/results/loading/error state.
- `leaderboardSlice` stores leaderboard filters/results/loading/error state.
- `useAuth()` is the main hook for reading/updating auth state.
