import { Link } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'
import Badge from '../ui/Badge.jsx'
import Tag from '../ui/Tag.jsx'
import { useUpvotePost, useBookmarkPost, useDeletePost } from '../../hooks/usePosts.js'
import useAuthStore from '../../store/authStore.js'
import styles from './PostCard.module.css'
import { formatDistanceToNow } from 'date-fns'

const UpvoteIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)
const ReplyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const BookmarkIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const PaperclipIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

/**
 * PostCard — community feed card.
 * @param {Object}  post      PostDTO from API
 * @param {boolean} skeleton  Render shimmer placeholder
 */
export default function PostCard({ post, skeleton = false }) {
  const currentUser = useAuthStore((s) => s.user)
  const { mutate: upvote } = useUpvotePost(post?.id)
  const { mutate: bookmarkPost } = useBookmarkPost(post?.id)
  const { mutate: deletePost } = useDeletePost()

  if (skeleton) {
    return (
      <div className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
        <div className={styles.skAvatar} />
        <div className={styles.body}>
          <div className={`${styles.skLine} ${styles.skTitle}`} />
          <div className={`${styles.skLine} ${styles.skMeta}`} />
        </div>
      </div>
    )
  }

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : ''

  const canDelete = currentUser && (currentUser.id === post.author?.id || currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR')

  const handleUpvote = (e) => {
    e.preventDefault()
    e.stopPropagation()
    upvote()
  }

  const handleBookmark = (e) => {
    e.preventDefault()
    e.stopPropagation()
    bookmarkPost()
  }

  const handleDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(post.id)
    }
  }

  return (
    <article className={styles.card}>
      {/* Author avatar */}
      {post.author?.id ? (
        <Link to={`/profile/${post.author.id}`} className={styles.avatarCol}>
          <Avatar name={post.author?.name} src={post.author?.avatarUrl} size="md" />
        </Link>
      ) : (
        <div className={styles.avatarCol}>
          <Avatar name={post.author?.name} src={post.author?.avatarUrl} size="md" />
        </div>
      )}

      <div className={styles.body}>
        {/* Header */}
        <div className={styles.header}>
          {post.author?.id ? (
            <Link to={`/profile/${post.author.id}`} className={styles.authorName} style={{ textDecoration: 'none', color: 'inherit' }}>
              {post.author?.name}
            </Link>
          ) : (
            <span className={styles.authorName}>{post.author?.name}</span>
          )}
          <span className={styles.dot} aria-hidden="true">·</span>
          <Badge type={post.type} />
          <span className={styles.timeAgo}>{timeAgo}</span>

          {canDelete && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDelete}
              title="Delete post"
              aria-label="Delete post"
            >
              <TrashIcon />
            </button>
          )}
        </div>

        {/* Title */}
        <Link to={`/community/${post.id}`} className={styles.titleLink}>
          <h2 className={styles.title}>{post.title}</h2>
        </Link>

        {/* Body snippet */}
        {post.body && (
          <p className={styles.snippet}>{post.body}</p>
        )}

        {/* Attached resource chip */}
        {post.linkedResource && (
          <Link
            to={`/library/${post.linkedResource.id}`}
            className={styles.attachChip}
            onClick={(e) => e.stopPropagation()}
          >
            <PaperclipIcon />
            <span className={styles.attachType}>{post.linkedResource.type}</span>
            <span className={styles.attachTitle}>{post.linkedResource.title}</span>
            {post.linkedResource.fileType && (
              <span className={styles.attachExt}>.{post.linkedResource.fileType}</span>
            )}
          </Link>
        )}

        {/* Tags */}
        {post.tags?.size > 0 || post.tags?.length > 0 ? (
          <div className={styles.tags}>
            {[...(post.tags ?? [])].slice(0, 5).map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>
        ) : null}

        {/* Action row */}
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.action} ${post.upvoted ? styles.upvoted : ''}`}
            onClick={handleUpvote}
            aria-label={post.upvoted ? 'Remove upvote' : 'Upvote'}
          >
            <UpvoteIcon filled={post.upvoted} />
            <span>{post.upvoteCount ?? 0}</span>
          </button>

          <Link to={`/community/${post.id}`} className={styles.action} aria-label="View replies">
            <ReplyIcon />
            <span>{post.replyCount ?? 0}</span>
          </Link>

          <button
            type="button"
            className={`${styles.action} ${post.bookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmark}
            aria-label={post.bookmarked ? 'Remove bookmark' : 'Bookmark post'}
          >
            <BookmarkIcon filled={post.bookmarked} />
            <span>{post.bookmarkCount ?? 0}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
