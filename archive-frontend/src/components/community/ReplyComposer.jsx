import { useState } from 'react'
import Avatar from '../ui/Avatar.jsx'
import Button from '../ui/Button.jsx'
import { useAddReply } from '../../hooks/usePosts.js'
import useAuthStore from '../../store/authStore.js'
import styles from './ReplyComposer.module.css'

/**
 * ReplyComposer — inline reply form.
 * @param {number}   postId
 * @param {number}   parentReplyId   null = top-level
 * @param {Function} onCancel
 */
export default function ReplyComposer({ postId, parentReplyId = null, onCancel }) {
  const user = useAuthStore((s) => s.user)
  const [body, setBody] = useState('')
  const { mutate: addReply, isPending } = useAddReply(postId)

  const handleSubmit = () => {
    if (!body.trim()) return
    addReply(
      { body: body.trim(), parentReplyId },
      { onSuccess: () => { setBody(''); onCancel?.() } },
    )
  }

  return (
    <div className={styles.composer}>
      <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
      <div className={styles.right}>
        <textarea
          className={styles.input}
          placeholder={parentReplyId ? 'Write a nested reply…' : 'Write a reply…'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={5000}
          autoFocus
        />
        <div className={styles.actions}>
          {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
          <Button variant="primary" disabled={!body.trim() || isPending} onClick={handleSubmit}>
            {isPending ? 'Posting…' : 'Reply'}
          </Button>
        </div>
      </div>
    </div>
  )
}
