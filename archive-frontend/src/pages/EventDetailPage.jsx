import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar.jsx'
import EventDetailPanel from '../components/events/EventDetailPanel.jsx'
import { useEvent } from '../hooks/useEvents.js'
import styles from './EventsPage.module.css'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: event, isLoading, error } = useEvent(id)

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        <button
          type="button"
          className={styles.pill}
          onClick={() => navigate('/events')}
          style={{ alignSelf: 'flex-start', marginBottom: '12px' }}
        >
          ← Back to All Events
        </button>

        {isLoading ? (
          <div className={styles.loadingStrip} style={{ minHeight: '300px' }}>
            <div className={styles.skeletonCard} style={{ width: '100%' }} />
          </div>
        ) : error || !event ? (
          <div className={styles.detailSection}>
            <p>Event not found or failed to load.</p>
          </div>
        ) : (
          <EventDetailPanel event={event} onDelete={() => navigate('/events')} />
        )}
      </div>
    </>
  )
}
