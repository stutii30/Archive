import React from 'react'
import { useSaveEvent } from '../../hooks/useEvents.js'
import styles from './EventCard.module.css'

export default function EventCard({ event, isSelected, onSelect }) {
  const saveMutation = useSaveEvent(event.id)

  const handleSaveClick = (e) => {
    e.stopPropagation()
    saveMutation.mutate()
  }

  // Format date display (e.g. "Aug 15 - Aug 17, 2026")
  const formatDateRange = () => {
    if (!event.startDate) return 'TBA'
    const start = new Date(event.startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    if (!event.endDate || event.startDate === event.endDate) {
      return start
    }
    const end = new Date(event.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return `${start} - ${end}`
  }

  const getCountdownLabel = () => {
    if (event.daysUntil == null) return null
    if (event.daysUntil < 0) return 'Ended'
    if (event.daysUntil === 0) return 'Today'
    if (event.daysUntil === 1) return 'Tomorrow'
    return `${event.daysUntil} days left`
  }

  const countdownText = getCountdownLabel()

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect()}
    >
      <div className={styles.topRow}>
        {countdownText ? (
          <span className={`${styles.countdownBadge} ${event.daysUntil <= 2 && event.daysUntil >= 0 ? styles.urgent : ''}`}>
            {countdownText}
          </span>
        ) : <div />}

        <button
          type="button"
          className={`${styles.saveBtn} ${event.saved ? styles.saved : ''}`}
          onClick={handleSaveClick}
          aria-label={event.saved ? 'Unsave event' : 'Save event'}
          title={event.saved ? 'Saved' : 'Save Event'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={event.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      <div className={styles.body}>
        <span className={styles.typeTag}>{event.type || 'EVENT'}</span>
        <h3 className={styles.title}>{event.title}</h3>
        {event.organizer && (
          <p className={styles.organizer}>by {event.organizer}</p>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.metaItem}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="mono">{formatDateRange()}</span>
        </div>
        {event.location && (
          <div className={styles.metaItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className={styles.locationText}>{event.location}</span>
          </div>
        )}
      </div>
    </div>
  )
}
