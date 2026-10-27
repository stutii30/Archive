import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import useAuthStore from '../../store/authStore.js'
import { useDeleteResource, useToggleBookmark } from '../../hooks/useResources.js'
import styles from './ResourceCard.module.css'

// Subject → accent CSS variable (drives the binder tab color)
const SUBJECT_COLOR = {
  'Computer Science': 'var(--teal)',
  'Mathematics':      'var(--primary)',
  'Physics':          'var(--coral)',
  'Chemistry':        'var(--amber)',
  'Electronics':      'var(--pink)',
  'Mechanical':       'var(--blue)',
  'Civil':            'var(--ink-soft)',
}

function getTabColor(subject) {
  return SUBJECT_COLOR[subject] ?? 'var(--primary)'
}

// Download icon
const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

// Bookmark icon
const BookmarkIcon = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

/**
 * ResourceCard — binder-tab card per Design.md §7.1.
 *
 * @param {Object}  resource - ResourceDTO from API
 * @param {boolean} skeleton - Render shimmer placeholder if true
 */
export default function ResourceCard({ resource, skeleton = false }) {
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const currentUser = useAuthStore((state) => state.user)
  const { mutate: deleteResource } = useDeleteResource()
  const { mutate: toggleBookmark } = useToggleBookmark(resource?.id)

  if (skeleton) {
    return (
      <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
        <div className={styles.tab} />
        <div className={styles.body}>
          <div className={`${styles.skLine} ${styles.skBadge}`} />
          <div className={`${styles.skLine} ${styles.skTitle}`} />
          <div className={`${styles.skLine} ${styles.skMeta}`} />
          <div className={styles.footer}>
            <div className={`${styles.skLine} ${styles.skAvatar}`} />
          </div>
        </div>
      </div>
    )
  }

  const tabColor = getTabColor(resource.subject)
  const isOwner = !resource.uploader?.id || (currentUser?.id && resource.uploader?.id && currentUser.id === resource.uploader.id)
  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
  const canDelete = isOwner || isAdminOrMod || !currentUser

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    deleteResource(resource.id, {
      onSuccess: () => {
        setConfirmDelete(false)
      },
      onError: (err) => {
        alert(err.response?.data?.message || err.message || 'Failed to delete resource.')
        setConfirmDelete(false)
      },
    })
  }

  const handleBookmark = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleBookmark()
  }

  return (
    <Link
      to={`/library/${resource.id}`}
      className={styles.card}
      aria-label={resource.title}
    >
      {/* Left binder tab */}
      <div className={styles.tab} style={{ background: tabColor }} aria-hidden="true" />

      <div className={styles.body}>
        {/* Top row: badge + filetype + delete */}
        <div className={styles.topRow}>
          <Badge type={resource.type} />
          {resource.fileType && (
            <span className={styles.fileType}>.{resource.fileType}</span>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              title={confirmDelete ? 'Click to confirm delete' : 'Delete resource'}
              style={{
                marginLeft: 'auto',
                background: confirmDelete ? '#ef4444' : 'transparent',
                color: confirmDelete ? '#ffffff' : 'var(--ink-faint)',
                border: confirmDelete ? 'none' : '1px solid var(--border-soft)',
                padding: '2px 8px',
                borderRadius: 'var(--r-sm)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 150ms ease',
              }}
            >
              🗑 {confirmDelete ? 'Confirm' : ''}
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className={styles.title}>{resource.title}</h3>

        {/* Meta: subject · semester · chapter */}
        <p className={styles.meta}>
          {[
            resource.subject,
            resource.semester ? `Sem ${resource.semester}` : null,
            resource.chapter,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {/* Footer */}
        <div className={styles.footer}>
          <div
            className={styles.uploaderChip}
            onClick={(e) => {
              if (resource.uploader?.id) {
                e.stopPropagation()
                e.preventDefault()
                navigate(`/profile/${resource.uploader.id}`)
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <Avatar name={resource.uploader?.name} src={resource.uploader?.avatarUrl} size="sm" />
            <span className={styles.uploaderName}>{resource.uploader?.name}</span>
          </div>

          <div className={styles.stats}>
            {resource.averageRating != null && (
              <span className={styles.stat} style={{ color: '#f59e0b', fontWeight: 600 }}>
                ★ {resource.averageRating} ({resource.reviewCount ?? 0})
              </span>
            )}
            <span className={styles.stat}>
              <DownloadIcon /> {resource.downloadCount ?? 0}
            </span>
            <button
              type="button"
              className={`${styles.stat} ${resource.bookmarked ? styles.bookmarked : ''}`}
              onClick={handleBookmark}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title={resource.bookmarked ? 'Remove bookmark' : 'Save resource'}
              aria-label={resource.bookmarked ? 'Remove bookmark' : 'Save resource'}
            >
              <BookmarkIcon filled={resource.bookmarked} /> {resource.bookmarkCount ?? 0}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
