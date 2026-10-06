# Project Context

- **Owner:** Michael Meznarich
- **Project:** RecipeHub — a recipe-sharing application designed to make it easy to store, search, and use recipes in the kitchen on a tablet.
- **Stack:** .NET 10 minimal API backend, React with TypeScript frontend, SQLite database.
- **Created:** 2026-10-05

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-10-06: Favorites UI

- Server state uses React Query (`@tanstack/react-query`). All query keys live in `hooks/queryKeys.ts` (`recipeKeys`, `tagKeys`, `favoriteKeys`, `shareKeys`).
- `api/client.ts` exposes `apiClient`, built on the `request<T>()` helper (throws `ApiError`, returns `undefined` on 204) and `jsonInit(method, body)` for POST/PUT. Favorites: `listFavorites`, `addFavorite` (POST `/api/favorites` `{ recipeId }`), `removeFavorite` (DELETE `/api/favorites/{id}`).
- Favorite state is derived from GET `/api/favorites` (`useFavorites`) into a `ReadonlySet<number>` via `useFavoriteIds()`; `isReady` is false until data loads.
- `useToggleFavorite()` updates the list optimistically (new favorite goes first, matching server order) and rolls back on error. It invalidates only when it is the last in-flight toggle, checked with `isMutating({ mutationKey: favoriteKeys.mutation() }) === 1`.
- `components/recipe/RecipeCard` (extracted from RecipeListPage) is shared by RecipeListPage and FavoritesPage.
- `ui/Card` renders as `role="button"` with click/keyboard handlers when `onClick` is set. Put interactive children (e.g. `FavoriteToggle`) in a sibling overlay, not inside the Card.
- The `/favorites` route and nav link already existed in `App.tsx`.
- HomePage featured cards still use inline `<Card>` markup and have no favorite toggle.
- `useDeleteRecipe` invalidates only `recipeKeys.lists()`, not favorites.
- The only Vitest tests (`test/placeholder.test.ts`, `hooks/__tests__/useCookMode.bug.test.tsx`) are all `it.skip`.
- Tablet convention: touch targets at least 48px (`FavoriteToggle` uses `min-width`/`min-height: 48px`).
