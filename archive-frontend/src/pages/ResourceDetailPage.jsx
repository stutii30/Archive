import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Tag from '../components/ui/Tag.jsx'
import Topbar from '../components/layout/Topbar.jsx'
import useAuthStore from '../store/authStore.js'
import {
  useResource,
  useToggleBookmark,
  useDownloadUrl,
  useDeleteResource,
  useResourceReviews,
  useAddReview,
  useDeleteReview,
} from '../hooks/useResources.js'
import styles from './ResourceDetailPage.module.css'

// Icons
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const BookmarkIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)

export default function ResourceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const download = useDownloadUrl()
  const currentUser = useAuthStore((state) => state.user)

  const [ratingInput, setRatingInput] = useState(5)
  const [commentInput, setCommentInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: resource, isLoading, isError } = useResource(id)
  const { mutate: toggleBookmark, isPending: bookmarkPending } = useToggleBookmark(id)
  const { mutate: deleteResource, isPending: isDeleting } = useDeleteResource()

  const { data: reviewsData } = useResourceReviews(id)
  const { mutate: addReview, isPending: isSubmittingReview } = useAddReview(id)
  const { mutate: deleteReview } = useDeleteReview(id)

  const reviewsList = reviewsData?.content || []

  if (isLoading) {
    return (
      <>
        <Topbar />
        <div className={styles.page}><div className={styles.skeleton} aria-label="Loading…" /></div>
      </>
    )
  }

  if (isError || !resource) {
    return (
      <>
        <Topbar />
        <div className={styles.page}>
          <div className={styles.errorState}>
            <p className={styles.errorTitle}>Resource not found</p>
            <Button variant="ghost" onClick={() => navigate('/library')}>← Back to Library</Button>
          </div>
        </div>
      </>
    )
  }

  const isPdf = resource.fileType === 'pdf'
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(resource.fileType)
  const isOwner = !resource.uploader?.id || (currentUser?.id && resource.uploader?.id && currentUser.id === resource.uploader.id)
  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
  const canDelete = isOwner || isAdminOrMod || !currentUser

  const handleDeleteResource = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 4000)
      return
    }
    deleteResource(id, {
      onSuccess: () => navigate('/library'),
      onError: (err) => {
        alert(err.response?.data?.message || err.message || 'Failed to delete resource.')
        setConfirmDelete(false)
      },
    })
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!ratingInput) return
    addReview(
      { rating: ratingInput, comment: commentInput },
      {
        onSuccess: () => setCommentInput(''),
      }
    )
  }

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        {/* Back link */}
        <button type="button" className={styles.backBtn} onClick={() => navigate('/library')}>
          <BackIcon /> Library
        </button>

        <div className={styles.layout}>
          {/* ── Left: preview ─────────────────────────────────────────────── */}
          <div className={styles.preview}>
            {isPdf ? (
              <iframe
                className={styles.pdfFrame}
                title={resource.title}
                src={`/api/resources/${id}/file`}
                aria-label="PDF preview"
              />
            ) : isImage ? (
              <img
                className={styles.imgPreview}
                src={`/api/resources/${id}/file`}
                alt={resource.title}
              />
            ) : (
              <div className={styles.noPreview}>
                <span className={styles.fileIcon} aria-hidden="true">📄</span>
                <p>Preview not available for .{resource.fileType} files</p>
                <p className={styles.previewHint}>Download to view</p>
              </div>
            )}
          </div>

          {/* ── Right: metadata sidebar ────────────────────────────────────── */}
          <aside className={styles.sidebar}>
            {/* Badge + filetype */}
            <div className={styles.topRow}>
              <Badge type={resource.type} />
              {resource.fileType && (
                <Tag label={resource.fileType} />
              )}
            </div>

            {/* Title */}
            <h1 className={styles.title}>{resource.title}</h1>

            {/* Meta tags */}
            <div className={styles.tags}>
              {resource.subject   && <Tag label={resource.subject} />}
              {resource.semester  && <Tag label={`Sem ${resource.semester}`} />}
              {resource.chapter   && <Tag label={resource.chapter} />}
              {resource.department && <Tag label={resource.department} />}
            </div>

            {/* Description */}
            {resource.description && (
              <p className={styles.description}>{resource.description}</p>
            )}

            {/* Stats */}
            <div className={styles.stats}>
              <span className={styles.stat}>
                <DownloadIcon /> {resource.downloadCount ?? 0} downloads
              </span>
              <span className={`${styles.stat} ${resource.bookmarked ? styles.bookmarkedStat : ''}`}>
                <BookmarkIcon filled={resource.bookmarked} /> {resource.bookmarkCount ?? 0} saved
              </span>
              {resource.averageRating != null && (
                <span className={styles.stat} style={{ color: '#f59e0b', fontWeight: 600 }}>
                  ★ {resource.averageRating} ({resource.reviewCount ?? 0})
                </span>
              )}
              {resource.fileSizeKb && (
                <span className={styles.stat}>
                  {resource.fileSizeKb >= 1024
                    ? `${(resource.fileSizeKb / 1024).toFixed(1)} MB`
                    : `${resource.fileSizeKb} KB`}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className={styles.actions}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => download(id)}
              >
                <DownloadIcon /> Download
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => toggleBookmark()}
                disabled={bookmarkPending}
                aria-label={resource.bookmarked ? 'Remove bookmark' : 'Save resource'}
              >
                <BookmarkIcon filled={resource.bookmarked} />
                {resource.bookmarked ? 'Saved' : 'Save'}
              </Button>
            </div>

            {/* Delete button for author/admin */}
            {canDelete && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={handleDeleteResource}
                disabled={isDeleting}
              >
                {confirmDelete ? 'Click again to confirm deletion' : '🗑 Delete Resource'}
              </button>
            )}

            {/* Divider */}
            <div className={styles.divider} />

            {/* Uploader card */}
            {resource.uploader && (
              <div className={styles.uploaderCard}>
                <p className={styles.uploaderLabel}>Uploaded by</p>
                {resource.uploader.id ? (
                  <Link
                    to={`/profile/${resource.uploader.id}`}
                    className={styles.uploaderRow}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Avatar
                      name={resource.uploader.name}
                      src={resource.uploader.avatarUrl}
                      size="lg"
                    />
                    <div className={styles.uploaderInfo}>
                      <p className={styles.uploaderName}>{resource.uploader.name}</p>
                      {resource.uploader.college && (
                        <p className={styles.uploaderMeta}>{resource.uploader.college}</p>
                      )}
                      {resource.uploader.department && (
                        <p className={styles.uploaderMeta}>{resource.uploader.department}</p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className={styles.uploaderRow}>
                    <Avatar
                      name={resource.uploader.name}
                      src={resource.uploader.avatarUrl}
                      size="lg"
                    />
                    <div className={styles.uploaderInfo}>
                      <p className={styles.uploaderName}>{resource.uploader.name}</p>
                      {resource.uploader.college && (
                        <p className={styles.uploaderMeta}>{resource.uploader.college}</p>
                      )}
                      {resource.uploader.department && (
                        <p className={styles.uploaderMeta}>{resource.uploader.department}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* ── Reviews & Ratings Section ───────────────────────────────────── */}
        <div className={styles.reviewsSection}>
          <div className={styles.reviewsHeader}>
            <h2 className={styles.reviewsTitle}>Reviews &amp; Ratings</h2>
            {resource.averageRating != null && (
              <div className={styles.ratingSummary}>
                ★ {resource.averageRating} / 5.0 ({resource.reviewCount} {resource.reviewCount === 1 ? 'review' : 'reviews'})
              </div>
            )}
          </div>

          {/* Submit Review Form */}
          <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
            <div className={styles.ratingSelector}>
              <span className={styles.ratingLabel}>Your Rating:</span>
              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.starBtn} ${star <= ratingInput ? styles.starBtnActive : ''}`}
                    onClick={() => setRatingInput(star)}
                    aria-label={`${star} star rating`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className={styles.reviewInput}
              placeholder="Was this resource helpful? Add a comment or review..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" type="submit" disabled={isSubmittingReview}>
                {isSubmittingReview ? 'Submitting…' : 'Post Review'}
              </Button>
            </div>
          </form>

          {/* Review List */}
          <div className={styles.reviewsList}>
            {reviewsList.length === 0 ? (
              <p style={{ color: 'var(--ink-faint)', fontSize: '14px' }}>
                No reviews yet. Be the first to leave a rating!
              </p>
            ) : (
              reviewsList.map((rev) => (
                <div key={rev.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewerInfo}>
                      <Avatar name={rev.user?.name} src={rev.user?.avatarUrl} size="sm" />
                      <div>
                        <span className={styles.reviewerName}>{rev.user?.name}</span>
                        <div className={styles.reviewRatingStars}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={styles.reviewDate}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                      {(currentUser?.id === rev.user?.id || isAdminOrMod) && (
                        <button
                          type="button"
                          className={styles.deleteReviewBtn}
                          onClick={() => deleteReview(rev.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {rev.comment && <p className={styles.reviewComment}>{rev.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
