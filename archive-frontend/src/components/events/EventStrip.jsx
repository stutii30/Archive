import React, { useRef } from 'react'
import EventCard from './EventCard.jsx'
import styles from './EventStrip.module.css'

export default function EventStrip({ events = [], selectedEventId, onSelectEvent }) {
  const containerRef = useRef(null)

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (!events || events.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No events found for this filter.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.scrollBtn} ${styles.scrollLeft}`}
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className={styles.strip} ref={containerRef}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isSelected={selectedEventId === event.id}
            onSelect={() => onSelectEvent(event)}
          />
        ))}
      </div>

      <button
        type="button"
        className={`${styles.scrollBtn} ${styles.scrollRight}`}
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
