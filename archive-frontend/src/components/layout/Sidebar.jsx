import { NavLink, useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'
import { useTheme } from '../../hooks/useTheme.js'
import { useAuth } from '../../hooks/useAuth.js'
import styles from './Sidebar.module.css'

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const IconLibrary = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)
const IconCommunity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconEvents = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconSaved = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const NAV_ITEMS = [
  { to: '/library',   label: 'Library',   Icon: IconLibrary },
  { to: '/community', label: 'Community', Icon: IconCommunity },
  { to: '/events',    label: 'Events',    Icon: IconEvents },
  { to: '/bookmarks', label: 'Saved',     Icon: IconSaved },
  { to: '/profile',   label: 'Profile',   Icon: IconProfile },
]

const THEME_SWATCHES = [
  { id: 'light',     color: '#F6F5FB', border: '#E7E5F3', label: 'Light' },
  { id: 'dark-grey', color: '#24252E', border: '#363744', label: 'Dark Grey' },
  { id: 'black',     color: '#121212', border: '#282828', label: 'Black' },
  { id: 'dark-blue', color: '#101B30', border: '#1F2E4C', label: 'Dark Blue' },
]

export default function Sidebar() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR'

  return (
    <aside className={styles.sidebar} aria-label="Sidebar navigation">
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div className={styles.brand} onClick={() => navigate('/library')} role="button" tabIndex={0} aria-label="Go to Library">
        <div className={styles.brandTabs}>
          <div className={`${styles.tab} ${styles.tab1}`} />
          <div className={`${styles.tab} ${styles.tab2}`} />
          <div className={`${styles.tab} ${styles.tab3}`} />
        </div>
        <span className={styles.brandName}>Archive</span>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin/moderation"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            style={{ color: '#ef4444' }}
          >
            <IconShield />
            <span>Admin Queue</span>
          </NavLink>
        )}
      </nav>

      {/* ── Spacer ────────────────────────────────────────────────────────── */}
      <div className={styles.spacer} />

      {/* ── Theme picker ──────────────────────────────────────────────────── */}
      <div className={styles.themeSection}>
        <p className={styles.themeLabel}>Theme</p>
        <div className={styles.swatches}>
          {THEME_SWATCHES.map(({ id, color, border, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={`${styles.swatch} ${theme === id ? styles.swatchActive : ''}`}
              style={{ background: color, borderColor: border }}
              aria-label={label}
              title={label}
            />
          ))}
        </div>
      </div>

      {/* ── Profile chip ──────────────────────────────────────────────────── */}
      {user && (
        <div className={styles.profileChip}>
          <div
            className={styles.profileMain}
            onClick={() => navigate('/profile')}
            role="button"
            tabIndex={0}
            title="View Profile"
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user.name}</span>
              <span className={styles.profileRole}>{user.role}</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={logout}
            title="Log Out"
            aria-label="Log Out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </aside>
  )
}
