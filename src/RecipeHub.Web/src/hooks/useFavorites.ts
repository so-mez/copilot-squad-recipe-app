import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { Recipe } from '../api';
import { favoriteKeys } from './queryKeys';

export function useFavorites() {
  return useQuery<Recipe[]>({
    queryKey: favoriteKeys.list(),
    queryFn: () => apiClient.listFavorites(),
  });
}

export function useFavoriteIds(): {
  ids: ReadonlySet<number>;
  isReady: boolean;
} {
  const { data } = useFavorites();
  const ids = useMemo(() => new Set((data ?? []).map((r) => r.id)), [data]);
  return { ids, isReady: data !== undefined };
}

export interface ToggleFavoriteVariables {
  recipe: Recipe;
  favorite: boolean;
}

interface ToggleFavoriteContext {
  previous: Recipe[] | undefined;
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, ToggleFavoriteVariables, ToggleFavoriteContext>({
    mutationKey: favoriteKeys.mutation(),
    mutationFn: ({ recipe, favorite }) =>
      favorite
        ? apiClient.addFavorite(recipe.id)
        : apiClient.removeFavorite(recipe.id),
    onMutate: async ({ recipe, favorite }) => {
      await qc.cancelQueries({ queryKey: favoriteKeys.list() });
      const previous = qc.getQueryData<Recipe[]>(favoriteKeys.list());
      qc.setQueryData<Recipe[]>(favoriteKeys.list(), (current = []) => {
        const without = current.filter((r) => r.id !== recipe.id);
        // Server orders newest favorite first.
        return favorite ? [recipe, ...without] : without;
      });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context) {
        qc.setQueryData(favoriteKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      // Avoid clobbering optimistic state while other toggles are still in flight.
      if (qc.isMutating({ mutationKey: favoriteKeys.mutation() }) === 1) {
        void qc.invalidateQueries({ queryKey: favoriteKeys.list() });
      }
    },
  });
}
