import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import resourceService from '../services/resourceService.js'
import communityService from '../services/communityService.js'
import { useSavedEvents } from '../hooks/useEvents.js'
import ResourceGrid from '../components/library/ResourceGrid.jsx'
import PostCard from '../components/community/PostCard.jsx'
import EventCard from '../components/events/EventCard.jsx'
import styles from './BookmarksPage.module.css'

export default function BookmarksPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'resources' | 'posts' | 'events'

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['bookmarks', 'resources'],
    queryFn: () => resourceService.getBookmarked(),
    placeholderData: keepPreviousData,
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['bookmarks', 'posts'],
    queryFn: () => communityService.getBookmarked(),
    placeholderData: keepPreviousData,
  })

  const { data: eventsData, isLoading: eventsLoading } = useSavedEvents()

  const resources = resourcesData?.content || []
  const posts = postsData?.content || []
  const events = eventsData?.content || []

  const resourceCount = resourcesData?.totalElements ?? resources.length
  const postCount = postsData?.totalElements ?? posts.length
  const eventCount = eventsData?.totalElements ?? events.length
  const totalCount = resourceCount + postCount + eventCount

  const showResourceSkeletons = resourcesLoading && resourcesData === undefined
  const showPostSkeletons = postsLoading && postsData === undefined
  const showEventSkeletons = eventsLoading && eventsData === undefined
  const isAllEmpty = !resourcesLoading && !postsLoading && !eventsLoading && resources.length === 0 && posts.length === 0 && events.length === 0

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Saved Bookmarks</h1>
        <p className={styles.subtitle}>
          Your saved library resources, community discussions, and event timelines in one place.
        </p>

        <div className={styles.tabContainer}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'resources' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources ({resourceCount})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'posts' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts ({postCount})
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'events' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events ({eventCount})
          </button>
        </div>
      </header>

      <main className={styles.content}>
        {activeTab === 'all' ? (
          isAllEmpty ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔖</span>
              <p className={styles.emptyTitle}>No saved items yet</p>
              <p className={styles.emptyHint}>
                Bookmark library resources, community posts, or event timelines to access them quickly here.
              </p>
            </div>
          ) : (
            <div className={styles.allSections}>
              {(showResourceSkeletons || resources.length > 0) && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Saved Resources</h2>
                    <span className={styles.sectionCount}>{resourceCount} items</span>
                  </div>
                  <ResourceGrid resources={resources} isLoading={showResourceSkeletons} />
                </section>
              )}

              {(showPostSkeletons || posts.length > 0) && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Saved Posts</h2>
                    <span className={styles.sectionCount}>{postCount} items</span>
                  </div>
                  <div className={styles.postsList}>
                    {showPostSkeletons ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <PostCard key={`sk-${i}`} skeleton />
                      ))
                    ) : (
                      posts.map((post) => <PostCard key={post.id} post={post} />)
                    )}
                  </div>
                </section>
              )}

              {(showEventSkeletons || events.length > 0) && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Saved Events</h2>
                    <span className={styles.sectionCount}>{eventCount} items</span>
                  </div>
                  <div className={styles.eventsGrid}>
                    {showEventSkeletons ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={`sk-ev-${i}`}
                          style={{
                            height: '160px',
                            background: 'var(--surface, #24252E)',
                            borderRadius: 'var(--r-lg, 22px)',
                            opacity: 0.5,
                          }}
                        />
                      ))
                    ) : (
                      events.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onSelect={() => navigate(`/events/${event.id}`)}
                        />
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>
          )
        ) : activeTab === 'resources' ? (
          <ResourceGrid resources={resources} isLoading={showResourceSkeletons} />
        ) : activeTab === 'posts' ? (
          <div className={styles.postsList}>
            {showPostSkeletons ? (
              Array.from({ length: 4 }).map((_, i) => (
                <PostCard key={`sk-${i}`} skeleton />
              ))
            ) : posts.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔖</span>
                <p className={styles.emptyTitle}>No saved posts</p>
                <p className={styles.emptyHint}>
                  Bookmark posts in the community feed to view them here later.
                </p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        ) : (
          <div className={styles.eventsGrid}>
            {showEventSkeletons ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`sk-ev-${i}`}
                  style={{
                    height: '160px',
                    background: 'var(--surface, #24252E)',
                    borderRadius: 'var(--r-lg, 22px)',
                    opacity: 0.5,
                  }}
                />
              ))
            ) : events.length === 0 ? (
              <div className={styles.empty} style={{ gridColumn: '1 / -1' }}>
                <span className={styles.emptyIcon}>📅</span>
                <p className={styles.emptyTitle}>No saved events</p>
                <p className={styles.emptyHint}>
                  Save events from the Events page to keep track of deadlines here.
                </p>
              </div>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={() => navigate(`/events/${event.id}`)}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
