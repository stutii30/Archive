import { useTrendingTags } from '../../hooks/usePosts.js'
import styles from './RailCard.module.css'

export function TrendingTagsCard({ onTagClick }) {
  const { data: tags = [], isLoading } = useTrendingTags()

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🔥 Trending Tags</h3>
      {isLoading ? (
        <div className={styles.skeleton} />
      ) : tags.length === 0 ? (
        <p className={styles.empty}>No trending tags yet</p>
      ) : (
        <div className={styles.tags}>
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className={styles.tagChip}
              onClick={() => onTagClick?.(tag)}
            >
              <span className={styles.tagName}>#{tag}</span>
              <span className={styles.tagCount}>{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
