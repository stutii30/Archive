import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import resourceService from '../../services/resourceService.js'
import styles from './AttachResourcePicker.module.css'

const PaperclipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)

export default function AttachResourcePicker({ selected, onSelect }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const wrapRef = useRef(null)

  // Search resources as user types (min 2 chars)
  const { data } = useQuery({
    queryKey: ['resource-search-picker', query],
    queryFn: () => resourceService.search(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
  })

  const results = data?.content ?? []

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (selected) {
    return (
      <div className={styles.chip}>
        <PaperclipIcon />
        <span className={styles.chipType}>{selected.type}</span>
        <span className={styles.chipTitle}>{selected.title}</span>
        <button
          type="button"
          className={styles.chipRemove}
          onClick={() => onSelect(null)}
          aria-label="Remove attached resource"
        >
          <XIcon />
        </button>
      </div>
    )
  }

  return (
    <div className={styles.picker} ref={wrapRef}>
      <div className={styles.inputWrap}>
        <PaperclipIcon />
        <input
          className={styles.input}
          type="text"
          placeholder="Attach a resource (type to search)…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && results.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {results.slice(0, 8).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={styles.option}
                onClick={() => { onSelect(r); setQuery(''); setOpen(false) }}
                role="option"
              >
                <span className={styles.optType}>{r.type}</span>
                <span className={styles.optTitle}>{r.title}</span>
                {r.fileType && <span className={styles.optExt}>.{r.fileType}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
