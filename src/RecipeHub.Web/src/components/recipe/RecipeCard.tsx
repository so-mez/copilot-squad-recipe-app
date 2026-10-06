import { useNavigate } from 'react-router-dom';
import { Badge, Card } from '../ui';
import type { Recipe } from '../../api';
import { FavoriteToggle } from './FavoriteToggle';
import styles from './RecipeCard.module.css';

export interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <Card
        title={<span className={styles.title}>{recipe.title}</span>}
        onClick={() => navigate(`/recipes/${recipe.id}`)}
        className={styles.card}
      >
        <p className={styles.description}>
          {recipe.description ?? 'No description.'}
        </p>
        <div className={styles.tags}>
          {recipe.tagNames.map((t) => (
            <Badge key={t} variant="info">
              {t}
            </Badge>
          ))}
        </div>
        <div className={styles.meta}>
          <span>{recipe.difficulty}</span>
          <span>
            Prep {recipe.prepTimeMinutes}m · Cook {recipe.cookTimeMinutes}m
          </span>
        </div>
      </Card>
      {/* Sibling of Card (not a child) to avoid nesting a button inside Card's role="button". */}
      <div className={styles.favorite}>
        <FavoriteToggle recipe={recipe} />
      </div>
    </div>
  );
}

export default RecipeCard;
