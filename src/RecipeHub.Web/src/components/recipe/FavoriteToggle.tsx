import type { Recipe } from '../../api';
import { useFavoriteIds, useToggleFavorite } from '../../hooks';
import styles from './FavoriteToggle.module.css';

export interface FavoriteToggleProps {
  recipe: Recipe;
  className?: string;
}

export function FavoriteToggle({ recipe, className }: FavoriteToggleProps) {
  const { ids, isReady } = useFavoriteIds();
  const toggle = useToggleFavorite();
  const isFavorite = ids.has(recipe.id);

  const classes = [styles.toggle, isFavorite ? styles.on : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={classes}
        aria-pressed={isFavorite}
        aria-label={`Favorite ${recipe.title}`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        disabled={!isReady}
        onClick={() => toggle.mutate({ recipe, favorite: !isFavorite })}
      >
        <span aria-hidden="true">{isFavorite ? '♥' : '♡'}</span>
      </button>
      {toggle.isError ? (
        <span className={styles.error} role="alert">
          Couldn't update favorite.
        </span>
      ) : null}
    </span>
  );
}

export default FavoriteToggle;
