import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import Tag from '../components/ui/Tag.jsx'
import Button from '../components/ui/Button.jsx'
import ReplyThread from '../components/community/ReplyThread.jsx'
import ReplyComposer from '../components/community/ReplyComposer.jsx'
import { usePost, useUpvotePost, useBookmarkPost, useDeletePost } from '../hooks/usePosts.js'
import useAuthStore from '../store/authStore.js'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import styles from './PostDetailPage.module.css'

const UpvoteIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
)
const BookmarkIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const PaperclipIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { data: post, isLoading, isError } = usePost(postId)
  const { mutate: upvote } = useUpvotePost(postId)
  const { mutate: bookmarkPost } = useBookmarkPost(postId)
  const { mutate: deletePost } = useDeletePost()

  if (isLoading) {
    return <><Topbar /><div className={styles.page}><div className={styles.skeleton} /></div></>
  }

  if (isError || !post) {
    return (
      <><Topbar />
        <div className={styles.page}>
          <div className={styles.error}>
            <p>Post not found</p>
            <Button variant="ghost" onClick={() => navigate('/community')}>← Back</Button>
          </div>
        </div>
      </>
    )
  }

  const timeAgo = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : ''

  const canDelete = currentUser && (currentUser.id === post.author?.id || currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR')

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(postId, {
        onSuccess: () => {
          navigate('/community')
        },
      })
    }
  }

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/community')}>
          <BackIcon /> Community
        </button>

        <article className={styles.post}>
          {/* Header */}
          <div className={styles.postHeader}>
            <Avatar name={post.author?.name} src={post.author?.avatarUrl} size="lg" />
            <div style={{ flex: 1 }}>
              <div className={styles.authorRow}>
                <span className={styles.authorName}>{post.author?.name}</span>
                <Badge type={post.type} />
              </div>
              <span className={styles.timeAgo}>{timeAgo}</span>
            </div>
            {canDelete && (
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete post
              </Button>
            )}
          </div>

          {/* Title */}
          <h1 className={styles.title}>{post.title}</h1>

          {/* Body */}
          {post.body && <p className={styles.body}>{post.body}</p>}

          {/* Attached resource */}
          {post.linkedResource && (
            <Link to={`/library/${post.linkedResource.id}`} className={styles.attachChip}>
              <PaperclipIcon />
              <span className={styles.attachType}>{post.linkedResource.type}</span>
              <span className={styles.attachTitle}>{post.linkedResource.title}</span>
            </Link>
          )}

          {/* Tags */}
          {post.tags && post.tags.size > 0 || post.tags?.length > 0 ? (
            <div className={styles.tags}>
              {[...(post.tags ?? [])].map((t) => <Tag key={t} label={t} />)}
            </div>
          ) : null}

          {/* Action row */}
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.action} ${post.upvoted ? styles.upvoted : ''}`}
              onClick={() => upvote()}
            >
              <UpvoteIcon filled={post.upvoted} />
              <span>{post.upvoteCount ?? 0} upvotes</span>
            </button>

            <button
              type="button"
              className={`${styles.action} ${post.bookmarked ? styles.bookmarked : ''}`}
              onClick={() => bookmarkPost()}
              aria-label={post.bookmarked ? 'Remove bookmark' : 'Bookmark post'}
            >
              <BookmarkIcon filled={post.bookmarked} />
              <span>{post.bookmarkCount ?? 0} saved</span>
            </button>

            <span className={styles.actionStat}>
              {post.replyCount ?? 0} replies
            </span>
          </div>
        </article>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Top-level reply composer */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Add a reply</h2>
          <ReplyComposer postId={postId} />
        </div>

        <div className={styles.divider} />

        {/* Reply thread */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {post.replyCount ?? 0} {post.replyCount === 1 ? 'Reply' : 'Replies'}
          </h2>
          <ReplyThread postId={postId} />
        </div>
      </div>
    </>
  )
}
