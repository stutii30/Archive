import { useState, useCallback, useRef } from 'react'
import Topbar from '../components/layout/Topbar.jsx'
import Composer from '../components/community/Composer.jsx'
import PostCard from '../components/community/PostCard.jsx'
import { TrendingTagsCard } from '../components/community/TrendingTagsCard.jsx'
import { usePostFeed } from '../hooks/usePosts.js'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js'
import Chip from '../components/ui/Chip.jsx'
import styles from './CommunityPage.module.css'

const POST_TYPES = [
  { value: '', label: 'All' },
  { value: 'DOUBT',          label: 'Doubts' },
  { value: 'PLACEMENT',      label: 'Placement' },
  { value: 'RESOURCE_SHARE', label: 'Shared' },
  { value: 'QA_PROBLEM',     label: 'Q&A' },
  { value: 'DSA_PROBLEM',    label: 'DSA' },
]

const SORTS = [
  { value: 'latest',   label: 'Latest' },
  { value: 'trending', label: 'Trending 🔥' },
]

export default function CommunityPage() {
  const [filters, setFilters] = useState({ type: '', tag: '', sort: 'latest' })
  const [composerExpanded, setComposerExpanded] = useState(false)
  const composerRef = useRef(null)

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = usePostFeed(filters)
  const posts = data?.pages?.flatMap((p) => p.content) ?? []

  const sentinelRef = useInfiniteScroll(
    useCallback(() => { if (hasNextPage) fetchNextPage() }, [hasNextPage, fetchNextPage]),
    hasNextPage,
    isFetchingNextPage,
  )

  const handlePostAction = () => {
    setComposerExpanded(true)
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <Topbar onAction={handlePostAction} />
      <div className={styles.page}>
        <div className={styles.feed}>
          <div className={styles.header}>
            <h1 className={styles.title}>Community</h1>
            <p className={styles.subtitle}>Ask doubts, share resources, discuss problems</p>
          </div>

          {/* Type & Sort filter chips */}
          <div className={styles.filterRow} style={{ justifyContent: 'space-between', alignItems: 'center' }} role="group" aria-label="Filter by type">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {POST_TYPES.map(({ value, label }) => (
                <Chip
                  key={value || 'all'}
                  label={label}
                  active={filters.type === value}
                  onClick={() => setFilters((f) => ({ ...f, type: value }))}
                />
              ))}
              {filters.tag && (
                <Chip
                  label={`#${filters.tag}`}
                  active
                  onClick={() => setFilters((f) => ({ ...f, tag: '' }))}
                />
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }} role="group" aria-label="Sort order">
              {SORTS.map(({ value, label }) => (
                <Chip
                  key={value}
                  label={label}
                  active={filters.sort === value}
                  onClick={() => setFilters((f) => ({ ...f, sort: value }))}
                />
              ))}
            </div>
          </div>

          {/* Composer */}
          <div ref={composerRef}>
            <Composer
              isExpanded={composerExpanded}
              onExpandToggle={setComposerExpanded}
            />
          </div>

          {/* Feed */}
          <div className={styles.postList} aria-live="polite">
            {isLoading && data === undefined
              ? Array.from({ length: 5 }).map((_, i) => <PostCard key={i} skeleton post={{}} />)
              : posts.map((post) => <PostCard key={post.id} post={post} />)}

            {!(isLoading && data === undefined) && posts.length === 0 && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true">💬</span>
                <p>No posts yet — start the conversation!</p>
              </div>
            )}
          </div>

          <div ref={sentinelRef} aria-hidden="true" />
        </div>

        {/* Right rail */}
        <aside className={styles.rail}>
          <TrendingTagsCard
            onTagClick={(tag) => setFilters((f) => ({ ...f, tag }))}
          />
        </aside>
      </div>
    </>
  )
}
