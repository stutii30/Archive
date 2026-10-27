import Chip from '../ui/Chip.jsx'
import useAuthStore from '../../store/authStore.js'
import { useDeleteSubject } from '../../hooks/useResources.js'
import styles from './FilterBar.module.css'

// Resource types with accent colors from Design.md §5
const TYPES = [
  { value: '',           label: 'All' },
  { value: 'NOTES',      label: 'Notes',      dot: 'var(--teal)' },
  { value: 'PYQ',        label: 'PYQ',        dot: 'var(--primary)' },
  { value: 'DSA',        label: 'DSA',        dot: 'var(--coral)' },
  { value: 'QA',         label: 'Q&A',        dot: 'var(--amber)' },
  { value: 'LAB_MANUAL', label: 'Lab Manual', dot: 'var(--pink)' },
  { value: 'PLACEMENT',  label: 'Placement',  dot: 'var(--blue)' },
  { value: 'OTHER',      label: 'Other',      dot: 'var(--ink-faint)' },
]

const SORTS = [
  { value: 'latest',   label: 'Latest' },
  { value: 'trending', label: 'Trending 🔥' },
]

/**
 * FilterBar — rows of chips for filtering resources by type, subject, and sort.
 *
 * @param {Object}   filters         Current filter state { type, subject, sort }
 * @param {Array}    subjects        Dynamic list of available subject objects or strings
 * @param {Function} onChange        Called with (key, value) when a chip is clicked
 * @param {Function} onCreateSubject Called when "+ Create Subject" is clicked
 */
export default function FilterBar({ filters = {}, subjects = [], onChange, onCreateSubject }) {
  const currentUser = useAuthStore((state) => state.user)
  const deleteSubjectMutation = useDeleteSubject()
  const deptLower = (currentUser?.department || '').trim().toLowerCase()

  // Only show DSA for Computer Science / IT / Tech department users
  const isCseUser = !deptLower || ['cse', 'computer', 'software', 'it', 'information technology', 'tech', 'b.tech cse'].some((keyword) => deptLower.includes(keyword))

  const visibleTypes = TYPES.filter((t) => t.value !== 'DSA' || isCseUser)

  return (
    <div className={styles.filterBar} aria-label="Resource filters">
      {/* Type chips */}
      <div className={styles.row} role="group" aria-label="Resource type">
        {visibleTypes.map(({ value, label, dot }) => (
          <Chip
            key={value || 'all-types'}
            label={label}
            active={filters.type === value}
            colorDot={dot}
            onClick={() => onChange('type', value)}
          />
        ))}
      </div>

      {/* Semester chips for selected year */}
      {filters.year && (
        <div className={styles.row} role="group" aria-label="Semester filter" style={{ alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ink-soft)', marginRight: '4px' }}>
            Year {filters.year} Semesters:
          </span>
          <Chip
            label={`All Year ${filters.year} (Sem ${filters.year * 2 - 1} & ${filters.year * 2})`}
            active={!filters.semester}
            onClick={() => onChange('semester', '')}
          />
          <Chip
            label={`Semester ${filters.year * 2 - 1}`}
            active={Number(filters.semester) === filters.year * 2 - 1}
            onClick={() => onChange('semester', Number(filters.semester) === filters.year * 2 - 1 ? '' : filters.year * 2 - 1)}
          />
          <Chip
            label={`Semester ${filters.year * 2}`}
            active={Number(filters.semester) === filters.year * 2}
            onClick={() => onChange('semester', Number(filters.semester) === filters.year * 2 ? '' : filters.year * 2)}
          />
        </div>
      )}

      {/* Subject & Sort chips */}
      <div className={styles.row} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }} role="group" aria-label="Subject">
          <Chip
            label="All subjects"
            active={!filters.subject}
            onClick={() => onChange('subject', '')}
          />

          {subjects.map((subj) => {
            const name = typeof subj === 'object' ? subj.name : subj
            const code = typeof subj === 'object' ? subj.code : null
            const labelStr = code ? `${name} (${code})` : name
            const keyVal = typeof subj === 'object' ? (subj.id || subj.code) : subj
            const isOwner = currentUser?.id && typeof subj === 'object' && subj.id && (!subj.creatorId || subj.creatorId === currentUser.id || currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR')

            const handleDelete = (e) => {
              e.stopPropagation()
              if (window.confirm(`Are you sure you want to delete subject "${name}"?`)) {
                deleteSubjectMutation.mutate(subj.id, {
                  onSuccess: () => {
                    if (filters.subject === name) {
                      onChange('subject', '')
                    }
                  },
                })
              }
            }

            return (
              <div key={keyVal} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <Chip
                  label={labelStr}
                  active={filters.subject === name}
                  onClick={() => onChange('subject', filters.subject === name ? '' : name)}
                />
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    title={`Delete subject ${name}`}
                    style={{
                      background: 'transparent',
                      color: 'var(--coral, #ef4444)',
                      border: '1px solid var(--coral, #ef4444)',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      transition: 'all 150ms ease',
                    }}
                    aria-label={`Delete subject ${name}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={onCreateSubject}
            style={{
              background: 'var(--primary-tint)',
              color: 'var(--primary)',
              border: '1px dashed var(--primary)',
              padding: '4px 12px',
              borderRadius: 'var(--r-full)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 150ms ease',
            }}
          >
            + Create Subject
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }} role="group" aria-label="Sort order">
            {SORTS.map(({ value, label }) => (
              <Chip
                key={value}
                label={label}
                active={(filters.sort || 'latest') === value}
                onClick={() => onChange('sort', value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
