import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar.jsx'
import ResourceCard from '../components/library/ResourceCard.jsx'
import PostCard from '../components/community/PostCard.jsx'
import EventCard from '../components/events/EventCard.jsx'
import { useSearch } from '../hooks/useSearch.js'
import styles from './SearchResultsPage.module.css'

const SCOPE_TABS = [
  { id: 'all', label: 'All Results' },
  { id: 'resources', label: 'Resources' },
  { id: 'posts', label: 'Community Posts' },
  { id: 'events', label: 'Events' },
]

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const [activeScope, setActiveScope] = useState('all')

  const { data, isLoading } = useSearch(query, activeScope)

  const resources = data?.resources ?? []
  const posts = data?.posts ?? []
  const events = data?.events ?? []
  const totalResults = data?.totalResults ?? 0

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {query ? `Search results for "${query}"` : 'Search'}
          </h1>
          <p className={styles.subtitle}>
            {isLoading
              ? 'Searching across archive...'
              : `${totalResults} result${totalResults === 1 ? '' : 's'} found`}
          </p>
        </div>

        {/* Scope Tabs */}
        <div className={styles.tabs} role="tablist">
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeScope === tab.id}
              className={`${styles.tab} ${activeScope === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveScope(tab.id)}
            >
              {tab.label}
              {tab.id === 'resources' && resources.length > 0 && ` (${resources.length})`}
              {tab.id === 'posts' && posts.length > 0 && ` (${posts.length})`}
              {tab.id === 'events' && events.length > 0 && ` (${events.length})`}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading && data === undefined ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <p>Searching...</p>
          </div>
        ) : totalResults === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📂</span>
            <p>No results found for "{query}". Try a different search query!</p>
          </div>
        ) : (
          <div>
            {/* Resources Section */}
            {(activeScope === 'all' || activeScope === 'resources') && resources.length > 0 && (
              <section className={styles.section}>
                {activeScope === 'all' && (
                  <h2 className={styles.sectionTitle}>Resources ({resources.length})</h2>
                )}
                <div className={styles.grid}>
                  {resources.map((res) => (
                    <ResourceCard key={`res-${res.id}`} resource={res} />
                  ))}
                </div>
              </section>
            )}

            {/* Posts Section */}
            {(activeScope === 'all' || activeScope === 'posts') && posts.length > 0 && (
              <section className={styles.section}>
                {activeScope === 'all' && (
                  <h2 className={styles.sectionTitle}>Community Posts ({posts.length})</h2>
                )}
                <div className={styles.list}>
                  {posts.map((post) => (
                    <PostCard key={`post-${post.id}`} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Events Section */}
            {(activeScope === 'all' || activeScope === 'events') && events.length > 0 && (
              <section className={styles.section}>
                {activeScope === 'all' && (
                  <h2 className={styles.sectionTitle}>Events ({events.length})</h2>
                )}
                <div className={styles.grid}>
                  {events.map((evt) => (
                    <EventCard
                      key={`evt-${evt.id}`}
                      event={evt}
                      onSelect={() => navigate(`/events/${evt.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  )
}
