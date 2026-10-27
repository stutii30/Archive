import styles from './Tag.module.css'

/**
 * Tag component — mono font, used for hashtags and subject labels.
 * @param {string}   label
 * @param {Function} onClick  Optional — makes it clickable
 */
export default function Tag({ label, onClick, className = '' }) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${styles.tag} ${onClick ? styles.clickable : ''} ${className}`}
    >
      {label.startsWith('#') ? label : `#${label}`}
    </Tag>
  )
}
