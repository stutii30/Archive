import styles from './Avatar.module.css'

const SIZE_MAP = { sm: 24, md: 32, lg: 40, xl: 48 }

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

/**
 * Avatar component
 * @param {string} name   - User's name (used for initials fallback)
 * @param {string} src    - Optional image URL
 * @param {'sm'|'md'|'lg'|'xl'} size
 */
export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  const px = SIZE_MAP[size] ?? 32
  const initials = getInitials(name)

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className}`}
      style={{ width: px, height: px, minWidth: px }}
      aria-label={name}
    >
      {src ? (
        <img src={src} alt={name} className={styles.img} />
      ) : (
        <span className={styles.initials} style={{ fontSize: Math.max(10, px * 0.38) }}>
          {initials}
        </span>
      )}
    </div>
  )
}
