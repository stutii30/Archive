import styles from './Chip.module.css'

/**
 * Chip component — used for filter tabs and subject chips.
 * @param {string}   label
 * @param {boolean}  active
 * @param {string}   colorDot  CSS color string for subject dot (optional)
 * @param {Function} onClick
 */
export default function Chip({ label, active = false, colorDot, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.chip} ${active ? styles.active : ''} ${className}`}
      aria-pressed={active}
    >
      {colorDot && (
        <span className={styles.dot} style={{ background: colorDot }} aria-hidden="true" />
      )}
      {label}
    </button>
  )
}
