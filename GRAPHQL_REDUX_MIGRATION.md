# GraphQL and Redux Migration

## Overview

TriviaVerse keeps the original Express REST API in `api/` and adds a new NestJS GraphQL backend in `api-nest/`.

The migration is intentionally partial. Public read-only features use GraphQL first, while complex gameplay and realtime flows stay on the existing REST/Socket.IO backend.

## Backend GraphQL

The new backend is organized with Nest modules:

- `DatabaseModule`: creates the Supabase client.
- `AuthModule`: exposes GraphQL login and current-user lookup.
- `HealthModule`: exposes the `health` GraphQL query.
- `CategoryModule`: exposes categories and category stats.
- `PublicModule`: exposes public read-only GraphQL queries.
- `QuizModule`: exposes public quiz discovery/details/rating/leaderboard GraphQL queries.
- `UsersModule`: exposes the current user's profile.

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
- `login`
- `me`
- `myProfile`
- `homeMetrics`
- `publicCategories`
- `topQuizzes`
- `leaderboard`
- `searchQuizzes`
- `publicQuiz`
- `publicQuizRatings`
- `publicQuizLeaderboard`
- `rateQuiz`
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
- Quiz rating mutation
- Current user's profile
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
- `profileSlice`: current profile payload, loading, and error state

The app is wrapped with Redux `Provider` in `src/main.tsx`.

`useAuth()` is the main hook for reading and updating the current user.

## What Stayed REST

These features stay on the old REST API for stability:

- Register network calls
- Refresh-token cookie flow
- Gameplay sessions
- Answer submission
- Lifelines
- Duels
- Socket.IO realtime
- Admin dashboard actions
- Protected quiz builder actions

This keeps the website operational while still showing a real GraphQL and Redux migration.
