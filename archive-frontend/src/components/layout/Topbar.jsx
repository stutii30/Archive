import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUnreadNotificationCount } from '../../hooks/useNotifications.js'
import NotificationDropdown from './NotificationDropdown.jsx'
import styles from './Topbar.module.css'

// ── Context-aware primary action config ───────────────────────────────────────
const getActionForPath = (pathname) => {
  if (pathname.startsWith('/library')) return { label: 'Upload', icon: '↑' }
  if (pathname.startsWith('/community')) return { label: 'Post', icon: '+' }
  if (pathname.startsWith('/events')) return { label: 'Create event', icon: '+' }
  return null
}

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

/**
 * Topbar — sticky header with search, notification bell, and context action button.
 * @param {Function} onAction  Called when the primary action button is clicked
 */
export default function Topbar({ onAction }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef(null)
  const notifRef = useRef(null)

  const { data: unreadData } = useUnreadNotificationCount()
  const notifCount = unreadData?.unreadCount ?? 0
  const action = getActionForPath(location.pathname)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && notifRef.current && !notifRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  return (
    <header className={styles.topbar}>
      {/* ── Search bar ────────────────────────────────────────────────────── */}
      <div className={styles.searchWrap}>
        <SearchIcon />
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search resources, posts, events…"
          className={styles.searchInput}
          aria-label="Search"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`)
            }
          }}
        />
        <kbd className={styles.shortcut}>⌘K</kbd>
      </div>

      {/* ── Right actions ─────────────────────────────────────────────────── */}
      <div className={styles.actions}>
        {/* Notification bell container */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Notifications${notifCount > 0 ? `, ${notifCount} unread` : ''}`}
            onClick={() => setShowDropdown((prev) => !prev)}
          >
            <BellIcon />
            {notifCount > 0 && (
              <span className={styles.badge} aria-hidden="true">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <NotificationDropdown onClose={() => setShowDropdown(false)} />
          )}
        </div>

        {/* Context-aware primary action */}
        {action && (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onAction}
            id="topbar-primary-action"
          >
            <span className={styles.actionIcon} aria-hidden="true">{action.icon}</span>
            {action.label}
          </button>
        )}
      </div>
    </header>
  )
}
