import ResourceCard from './ResourceCard.jsx'
import styles from './ResourceGrid.module.css'

const SKELETON_COUNT = 8

/**
 * ResourceGrid — auto-fill CSS grid of ResourceCards.
 *
 * @param {Array}    resources   Flat list of resource objects
 * @param {boolean}  isLoading   Show skeleton cards
 * @param {boolean}  isError     Show error state
 * @param {Function} onRetry     Retry callback for error state
 * @param {Element}  sentinel    Ref'd div appended after cards for infinite scroll
 */
export default function ResourceGrid({ resources = [], isLoading, isError, onRetry, sentinelRef }) {
  const showSkeletons = isLoading && resources.length === 0

  return (
    <div className={styles.grid} aria-live="polite">
      {/* Real cards */}
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}

      {/* Skeleton cards while loading first page */}
      {showSkeletons &&
        Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ResourceCard key={`sk-${i}`} skeleton />
        ))}

      {/* Error state */}
      {isError && !isLoading && (
        <div className={styles.empty} style={{ gridColumn: '1 / -1' }}>
          <span className={styles.emptyIcon} aria-hidden="true">⚠️</span>
          <p className={styles.emptyTitle}>Failed to load resources</p>
          <p className={styles.emptyHint}>Check your connection or try again.</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                marginTop: '0.75rem',
                padding: '6px 16px',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--r-full)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && resources.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden="true">📂</span>
          <p className={styles.emptyTitle}>No resources found</p>
          <p className={styles.emptyHint}>Try adjusting the filters or be the first to upload!</p>
        </div>
      )}

      {/* Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
    </div>
  )
}
