import React, { useState } from 'react'
import { useSaveEvent, useDeleteEvent } from '../../hooks/useEvents.js'
import useAuthStore from '../../store/authStore.js'
import TimelineView from './TimelineView.jsx'
import styles from './EventDetailPanel.module.css'

export default function EventDetailPanel({ event, onClose, onDelete }) {
  const saveMutation = useSaveEvent(event?.id)
  const deleteMutation = useDeleteEvent()
  const currentUser = useAuthStore((state) => state.user)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!event) {
    return (
      <div className={styles.placeholderPanel}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.placeholderIcon}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p>Select an event from the strip to view detailed timeline &amp; registration information.</p>
      </div>
    )
  }

  const isCreator = currentUser?.id && event.creator?.id && currentUser.id === event.creator.id
  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
  const canDelete = isCreator || isAdminOrMod

  const handleSaveToggle = () => {
    saveMutation.mutate()
  }

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    const deletedId = event.id
    deleteMutation.mutate(deletedId, {
      onSuccess: () => {
        if (onClose) onClose()
        if (onDelete) onDelete(deletedId)
      },
    })
  }

  const formatDateRange = () => {
    if (!event.startDate) return 'Date TBA'
    const start = new Date(event.startDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!event.endDate || event.startDate === event.endDate) {
      return start
    }
    const end = new Date(event.endDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return `${start} — ${end}`
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.typeBadgeRow}>
          <span className={`${styles.typeBadge} mono`}>{event.type || 'EVENT'}</span>
          {event.daysUntil != null && (
            <span className={`${styles.daysBadge} mono`}>
              {event.daysUntil < 0 ? 'Concluded' : event.daysUntil === 0 ? 'Starting Today' : `${event.daysUntil} Days Away`}
            </span>
          )}
        </div>

        {onClose && (
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <h2 className={styles.title}>{event.title}</h2>

      <div className={styles.metaGrid}>
        {event.organizer && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Organizer</span>
            <span className={styles.metaValue}>{event.organizer}</span>
          </div>
        )}
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Date</span>
          <span className={styles.metaValue}>{formatDateRange()}</span>
        </div>
        {event.location && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Location</span>
            <span className={styles.metaValue}>{event.location}</span>
          </div>
        )}
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Saved By</span>
          <span className={styles.metaValue}>{event.registrantCount || 0} students</span>
        </div>
      </div>

      <div className={styles.actionsRow}>
        {event.registrationLink && (
          <a
            href={event.registrationLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.registerBtn}
          >
            Register / External Link
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}

        <button
          type="button"
          className={`${styles.saveBtn} ${event.saved ? styles.saved : ''}`}
          onClick={handleSaveToggle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={event.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          {event.saved ? 'Saved to Reminders' : 'Save Event'}
        </button>

        {canDelete && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {confirmDelete ? 'Confirm Delete?' : '🗑 Delete Event'}
          </button>
        )}
      </div>

      {event.description && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Overview</h4>
          <p className={styles.description}>{event.description}</p>
        </div>
      )}

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Timeline &amp; Schedule</h4>
        <TimelineView stages={event.stages || []} />
      </div>
    </div>
  )
}
