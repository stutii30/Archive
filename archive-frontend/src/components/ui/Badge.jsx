import styles from './Badge.module.css'

/** Accent type → CSS variable mapping (matches Design.md accent-to-meaning map) */
const TYPE_MAP = {
  NOTES:            { bg: 'var(--teal-tint)',    text: 'var(--teal)' },
  PYQ:              { bg: 'var(--primary-tint)', text: 'var(--primary)' },
  DSA:              { bg: 'var(--coral-tint)',   text: 'var(--coral)' },
  QA:               { bg: 'var(--amber-tint)',   text: 'var(--amber)' },
  LAB_MANUAL:       { bg: 'var(--pink-tint)',    text: 'var(--pink)' },
  PLACEMENT:        { bg: 'var(--blue-tint)',    text: 'var(--blue)' },
  OTHER:            { bg: 'var(--border-soft)',  text: 'var(--ink-soft)' },
  // Post types
  DOUBT:            { bg: 'var(--coral-tint)',   text: 'var(--coral)' },
  RESOURCE_SHARE:   { bg: 'var(--teal-tint)',    text: 'var(--teal)' },
  QA_PROBLEM:       { bg: 'var(--amber-tint)',   text: 'var(--amber)' },
  DSA_PROBLEM:      { bg: 'var(--coral-tint)',   text: 'var(--coral)' },
}

/**
 * Badge component — color-coded label for resource/post types.
 * @param {string} type   - e.g. 'NOTES', 'DOUBT', 'PYQ'
 * @param {string} label  - Display text (defaults to formatted type)
 */
export default function Badge({ type = 'OTHER', label, className = '' }) {
  const colors = TYPE_MAP[type] ?? TYPE_MAP.OTHER
  const displayLabel = label ?? type.replace(/_/g, ' ')

  return (
    <span
      className={`${styles.badge} ${className}`}
      style={{ background: colors.bg, color: colors.text }}
    >
      {displayLabel}
    </span>
  )
}
