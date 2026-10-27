import { useState } from 'react'
import Topbar from '../components/layout/Topbar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import { usePendingModeration, useApproveResource, useRejectResource } from '../hooks/useResources.js'
import useAuthStore from '../store/authStore.js'
import styles from './AdminModerationPage.module.css'

export default function AdminModerationPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR'

  const [page] = useState(0)
  const { data: pageData, isLoading } = usePendingModeration(page)
  const { mutate: approve, isPending: approvePending } = useApproveResource()
  const { mutate: reject, isPending: rejectPending } = useRejectResource()

  const pendingItems = pageData?.content || []

  if (!isAdmin) {
    return (
      <>
        <Topbar />
        <div className={styles.page}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔒</span>
            <h2 className={styles.emptyTitle}>Access Denied</h2>
            <p className={styles.emptyDesc}>
              Only administrators or moderators configured in the database can view the Admin Moderation Queue.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.badge}>
            🛡 Admin Control Panel
          </div>
          <h1 className={styles.title}>AI Moderation Queue</h1>
          <p className={styles.subtitle}>
            Review resources flagged by Gemini AI for potential unwanted content, inappropriate keywords, or subject mismatch.
          </p>
        </header>

        {isLoading ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyDesc}>Loading flagged resources…</p>
          </div>
        ) : pendingItems.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✨</span>
            <h2 className={styles.emptyTitle}>All Clear!</h2>
            <p className={styles.emptyDesc}>
              There are currently no pending resources in the AI moderation queue.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {pendingItems.map((item) => (
              <div key={item.id} className={styles.card}>
                <div>
                  <div className={styles.cardHeader}>
                    <span className={styles.resourceType}>{item.type}</span>
                    <span className={styles.flagTag}>⚠️ {item.moderationFlag || 'PENDING'}</span>
                  </div>

                  <h3 className={styles.cardTitle}>{item.title}</h3>

                  <p className={styles.cardMeta}>
                    {[item.subject, item.semester ? `Sem ${item.semester}` : null, item.fileType ? `.${item.fileType}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  {item.aiNotice && (
                    <div className={styles.noticeBox}>
                      <strong>AI Statement:</strong> {item.aiNotice}
                    </div>
                  )}

                  <div className={styles.uploaderRow}>
                    <Avatar name={item.uploader?.name} src={item.uploader?.avatarUrl} size="sm" />
                    <div>
                      <p className={styles.uploaderName}>{item.uploader?.name}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.approveBtn}
                    onClick={() => approve(item.id)}
                    disabled={approvePending}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    className={styles.rejectBtn}
                    onClick={() => {
                      if (window.confirm('Reject and delete this flagged upload?')) {
                        reject(item.id)
                      }
                    }}
                    disabled={rejectPending}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
