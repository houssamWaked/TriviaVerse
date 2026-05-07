# GraphQL and Redux Migration

## Overview

TriviaVerse keeps the original Express REST API in `api/` and adds a new NestJS GraphQL backend in `api-nest/`.

The migration is intentionally partial. Public read-only features use GraphQL first, while complex gameplay and realtime flows stay on the existing REST/Socket.IO backend.

## Backend GraphQL

The new backend is organized with Nest modules:

- `DatabaseModule`: creates the Supabase client.
- `HealthModule`: exposes the `health` GraphQL query.
- `CategoryModule`: exposes categories and category stats.
- `PublicModule`: exposes public read-only GraphQL queries.
- `QuizModule`: exposes public quiz discovery/details/rating/leaderboard GraphQL queries.

The public GraphQL flow is:

```txt
GraphQL request
-> Resolver for the feature
-> Service for the feature
-> Supabase
-> GraphQL response
```

Current GraphQL queries:

- `health`
- `homeMetrics`
- `publicCategories`
- `topQuizzes`
- `leaderboard`
- `searchQuizzes`
- `publicQuiz`
- `publicQuizRatings`
- `publicQuizLeaderboard`
- `categoryStats`

## Frontend GraphQL

The frontend uses `src/api/graphqlClient.ts` for GraphQL requests and `src/api/graphqlPublicApi.ts` for public GraphQL operations.

Migrated frontend reads:

- Home metrics
- Classic page categories and metrics
- Discover page top quizzes
- Discover page search
- Quiz details
- Quiz rating summary
- Quiz-specific leaderboard
- Category stats fallback counts
- Leaderboard entries

Each migrated feature uses GraphQL first and falls back to the old REST API if GraphQL is unavailable.

## Redux

Redux Toolkit is used for global state in `client/Trivia/src/store/`.

Current slices:

- `authSlice`: current user state
- `globalSlice`: shared global UI state placeholder
- `leaderboardSlice`: leaderboard filters, entries, loading, and error state
- `discoverSlice`: discover page query, results, loading, and error state

The app is wrapped with Redux `Provider` in `src/main.tsx`.

`useAuth()` is the main hook for reading and updating the current user.

## What Stayed REST

These features stay on the old REST API for stability:

- Login/register network calls
- Gameplay sessions
- Answer submission
- Lifelines
- Duels
- Socket.IO realtime
- Admin dashboard actions
- Protected quiz builder actions

This keeps the website operational while still showing a real GraphQL and Redux migration.
