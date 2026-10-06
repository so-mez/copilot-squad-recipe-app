# Project Context

- **Owner:** Michael Meznarich
- **Project:** RecipeHub — a recipe-sharing application designed to make it easy to store, search, and use recipes in the kitchen on a tablet.
- **Stack:** .NET 10 minimal API backend, React with TypeScript frontend, SQLite database.
- **Created:** 2026-10-05

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-10-06: Favorites API

- Endpoints live in `src/RecipeHub.Api/Endpoints/*Endpoints.cs` as static classes with a `Map*Endpoints(this WebApplication)` extension; request/response records live in `Dtos/`. Favorites: `FavoriteEndpoints.cs` uses `MapGroup("/api/favorites")` (GET `/`, POST `/`, DELETE `/{recipeId:int}`); body is `AddFavoriteRequest(int RecipeId)`.
- The `Favorites` table, unique `(UserId, RecipeId)` index, and cascade delete from `Recipe` already exist in `20260420180648_InitialCreate` and `RecipeDbContext` — no new migration was needed.
- No auth exists. Favorites are scoped by optional `X-User-Id` header, falling back to `"default-user"`; values over 128 chars return a 400 ValidationProblem.
- POST is idempotent: an existing favorite (or a unique-index `DbUpdateException` race) returns 200 instead of 201; DELETE returns 404 only if the recipe is missing.
- Recipe→DTO mapping is duplicated: `ToSummaryDto` in Recipe/Search/Favorite endpoints, `ToDetailDto` in Recipe/Share endpoints.
- Known bug (BUG-003): `ShareEndpoints.CreateShareAsync` sets `share.Token` after `SaveChangesAsync`, so the returned token is never persisted.
- All 9 tests in `tests/RecipeHub.Api.Tests` are `[Fact(Skip = ...)]` (BUG-001/002/003 tests plus a placeholder).
