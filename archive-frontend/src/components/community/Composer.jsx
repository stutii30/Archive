import { useState } from 'react'
import Avatar from '../ui/Avatar.jsx'
import Button from '../ui/Button.jsx'
import AttachResourcePicker from './AttachResourcePicker.jsx'
import { useCreatePost } from '../../hooks/usePosts.js'
import useAuthStore from '../../store/authStore.js'
import styles from './Composer.module.css'

const POST_TYPES = [
  { value: 'DOUBT',          label: 'Doubt' },
  { value: 'PLACEMENT',      label: 'Placement' },
  { value: 'RESOURCE_SHARE', label: 'Resource Share' },
  { value: 'QA_PROBLEM',     label: 'Q&A' },
  { value: 'DSA_PROBLEM',    label: 'DSA' },
]

/**
 * Composer — post creation card at the top of the feed.
 */
export default function Composer({ isExpanded: externalExpanded, onExpandToggle }) {
  const user = useAuthStore((s) => s.user)
  const [internalExpanded, setInternalExpanded] = useState(false)

  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded
  const setExpanded = (val) => {
    if (onExpandToggle) onExpandToggle(val)
    setInternalExpanded(val)
  }

  const [type, setType]             = useState('DOUBT')
  const [title, setTitle]           = useState('')
  const [body, setBody]             = useState('')
  const [tags, setTags]             = useState('')
  const [linkedResource, setLinkedResource] = useState(null)

  const { mutate: createPost, isPending } = useCreatePost()

  const handleSubmit = () => {
    if (!title.trim()) return
    const tagSet = tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10)
    createPost(
      {
        type,
        title: title.trim(),
        body: body.trim() || undefined,
        tags: tagSet,
        linkedResourceId: linkedResource?.id ?? undefined,
      },
      {
        onSuccess: () => {
          setTitle(''); setBody(''); setTags(''); setLinkedResource(null)
          setExpanded(false)
        },
      },
    )
  }

  return (
    <div className={styles.composer}>
      {/* Avatar + collapsed trigger */}
      <div className={styles.topRow}>
        <Avatar name={user?.name} src={user?.avatarUrl} size="md" />
        {!expanded ? (
          <button
            type="button"
            className={styles.trigger}
            onClick={() => setExpanded(true)}
            id="composer-trigger"
          >
            What's on your mind? Ask a doubt, share a resource…
          </button>
        ) : (
          <input
            className={styles.titleInput}
            type="text"
            placeholder="Title — what's your question or topic?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={400}
            autoFocus
          />
        )}
      </div>

      {/* Expanded form */}
      {expanded && (
        <>
          {/* Post-type segment pills */}
          <div className={styles.typeRow} role="group" aria-label="Post type">
            {POST_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`${styles.typePill} ${type === t.value ? styles.typePillActive : ''}`}
                onClick={() => setType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body textarea */}
          <textarea
            className={styles.bodyInput}
            placeholder="Add more context (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={10000}
          />

          {/* Tag input */}
          <input
            className={styles.tagInput}
            type="text"
            placeholder="Tags — comma separated (e.g. os, scheduling, sem5)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {/* Attach resource */}
          <AttachResourcePicker
            selected={linkedResource}
            onSelect={setLinkedResource}
          />

          {/* Footer actions */}
          <div className={styles.footer}>
            <Button variant="ghost" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!title.trim() || isPending}
              onClick={handleSubmit}
              id="composer-submit"
            >
              {isPending ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
