# Squad Decisions

## Active Decisions

### 2026-10-06: Favorites API — user identity and contract
**By:** Mabel (requested by Michael Meznarich)

**What:**
- No auth/user concept exists in RecipeHub. Favorites are scoped by an optional `X-User-Id` request header (trimmed, max 128 chars). If absent/blank, the single implicit user `default-user` is used. No authentication is implied — the header is not trusted identity.
- Contract:
  - `GET /api/favorites` → 200 `RecipeDto[]` (same shape as `GET /api/recipes`), newest favorite first.
  - `POST /api/favorites` body `{ "recipeId": int }` → 201 `RecipeDto` (new, Location `/api/favorites/{recipeId}`), 200 `RecipeDto` (already favorited), 404 (unknown recipe).
  - `DELETE /api/favorites/{recipeId}` → 204 (removed or was not a favorite — idempotent), 404 (unknown recipe).
  - Over-long `X-User-Id` → 400 ValidationProblem.
- Recipe list/detail DTOs do NOT get an `isFavorite` flag. The UI derives favorite state from the ids in `GET /api/favorites`.
- Schema already existed in `InitialCreate` (Favorites table, unique `(UserId, RecipeId)`, cascade on recipe delete) — no new migration.

**Why:** Simplest approach consistent with an auth-less app; avoids touching shared recipe DTOs and search/share mappers. If real auth is added later, replace `TryResolveUserId` in `FavoriteEndpoints` with the authenticated user's id.

### 2026-10-06: Favorites UI — client-side favorite state
**By:** Dipper (requested by Michael Meznarich)

**What:**
- Favorite state lives in the React Query cache under `favoriteKeys.list()` (`['favorites','list']`), loaded from `GET /api/favorites`. No separate React context. `useFavoriteIds()` turns that cache into a `Set<number>`, so every card toggle and the Favorites page read from the same source and stay in sync.
- `useToggleFavorite()` (mutationKey `['favorites','toggle']`) updates the list optimistically: adding puts the recipe first, matching the server's newest-first order; removing filters it out. If the request fails, it restores the previous snapshot and shows an inline "Couldn't update favorite." alert. It refetches the list only after the last in-flight toggle settles.
- New shared `RecipeCard` (`components/recipe/RecipeCard.tsx`), pulled out of `RecipeListPage`, is used by both `/recipes` and `/favorites`. The favorite button sits next to the clickable `Card` in the DOM, positioned over it, so a button isn't nested inside `Card`'s `role="button"`.
- Toggle a11y: a fixed `aria-label="Favorite {title}"` plus `aria-pressed`. The touch target is at least 48×48px. The toggle is disabled until favorites have loaded, so the UI never shows a wrong state.
- No `X-User-Id` header is sent; the app uses the implicit default user.

**Why:** React Query already owns server state in this app, so a separate context would duplicate it. Deriving from the cache keeps a single source of truth.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
