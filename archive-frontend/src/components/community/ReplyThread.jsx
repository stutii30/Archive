import { useState, useCallback } from 'react'
import Avatar from '../ui/Avatar.jsx'
import ReplyComposer from './ReplyComposer.jsx'
import { useReplies, useDeleteReply } from '../../hooks/usePosts.js'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js'
import useAuthStore from '../../store/authStore.js'
import { formatDistanceToNow } from 'date-fns'
import styles from './ReplyThread.module.css'

function ReplyItem({ reply, postId, depth = 0 }) {
  const [showReply, setShowReply] = useState(false)
  const currentUser = useAuthStore((s) => s.user)
  const { mutate: deleteReply, isPending: isDeleting } = useDeleteReply(postId)

  const timeAgo = reply.createdAt
    ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })
    : ''

  const canDelete = Boolean(
    currentUser?.id && reply?.author?.id && Number(currentUser.id) === Number(reply.author.id)
  )

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      deleteReply(reply.id)
    }
  }

  return (
    <div className={`${styles.replyItem} ${depth > 0 ? styles.nested : ''}`}>
      <Avatar name={reply.author?.name} src={reply.author?.avatarUrl} size="sm" />
      <div className={styles.replyBody}>
        <div className={styles.replyHeader}>
          <span className={styles.replyAuthor}>{reply.author?.name}</span>
          <span className={styles.replyTime}>{timeAgo}</span>
        </div>
        <p className={styles.replyText}>{reply.body}</p>
        <div className={styles.replyActions}>
          {depth === 0 && (
            <button
              type="button"
              className={styles.replyBtn}
              onClick={() => setShowReply((v) => !v)}
            >
              {showReply ? 'Cancel' : 'Reply'}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
        {showReply && depth === 0 && (
          <div className={styles.nestedComposer}>
            <ReplyComposer
              postId={postId}
              parentReplyId={reply.id}
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}
        {/* Nested replies */}
        {reply.nested?.map((n) => (
          <ReplyItem key={n.id} reply={n} postId={postId} depth={1} />
        ))}
      </div>
    </div>
  )
}

/**
 * ReplyThread — infinite list of top-level replies, each with expandable nested replies.
 */
export default function ReplyThread({ postId }) {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useReplies(postId)

  const replies = data?.pages?.flatMap((p) => p.content) ?? []

  const sentinelRef = useInfiniteScroll(
    useCallback(() => { if (hasNextPage) fetchNextPage() }, [hasNextPage, fetchNextPage]),
    hasNextPage,
    isFetchingNextPage,
  )

  if (isLoading) {
    return <p className={styles.loading}>Loading replies…</p>
  }

  if (replies.length === 0) {
    return <p className={styles.empty}>No replies yet — be the first to respond!</p>
  }

  return (
    <div className={styles.thread}>
      {replies.map((r) => (
        <ReplyItem key={r.id} reply={r} postId={postId} />
      ))}
      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  )
}
