import { Link } from 'react-router-dom';
import { Button, Spinner } from '../components/ui';
import { RecipeCard } from '../components/recipe';
import { useFavorites } from '../hooks';
import styles from './FavoritesPage.module.css';

export function FavoritesPage() {
  const { data, isLoading, isError, error } = useFavorites();
  const favorites = data ?? [];

  return (
    <div>
      <h1 className={styles.heading}>Favorites</h1>

      {isLoading ? (
        <Spinner label="Loading favorites…" />
      ) : isError ? (
        <div className={styles.error} role="alert">
          Couldn't load favorites. {error instanceof Error ? error.message : ''}
        </div>
      ) : favorites.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No favorites yet.</p>
          <p className={styles.emptyHint}>
            Tap the ♡ on any recipe to save it here for quick access.
          </p>
          <Link to="/recipes">
            <Button variant="primary" size="lg">
              Browse Recipes
            </Button>
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {favorites.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
