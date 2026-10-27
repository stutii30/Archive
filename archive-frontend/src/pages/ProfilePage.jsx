import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import ResourceCard from '../components/library/ResourceCard.jsx'
import PostCard from '../components/community/PostCard.jsx'
import EditProfileModal from '../components/profile/EditProfileModal.jsx'
import { useUserProfile, useUserUploads, useUserPosts, useDeleteAccount } from '../hooks/useUserProfile.js'
import { useAuth } from '../hooks/useAuth.js'
import useAuthStore from '../store/authStore.js'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { userId: rawUserId } = useParams()
  const navigate = useNavigate()
  const userId = (rawUserId && rawUserId !== 'undefined' && rawUserId !== 'null') ? rawUserId : undefined
  const currentUser = useAuthStore((state) => state.user)
  const { logout } = useAuth()

  const [activeTab, setActiveTab] = useState('uploads')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const deleteAccountMutation = useDeleteAccount()

  // Fetch profile
  const { data: profile, isLoading } = useUserProfile(userId)

  // Fetch contributions
  const isOwnProfile = !userId || (currentUser && String(currentUser.id) === String(profile?.id || userId))
  const displayProfile = profile || (isOwnProfile ? currentUser : null)
  const targetId = userId || profile?.id || currentUser?.id

  const { data: uploadsData } = useUserUploads(targetId)
  const { data: postsData } = useUserPosts(targetId)

  const uploads = uploadsData?.content ?? []
  const posts = postsData?.content ?? []

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync()
      setDeleteModalOpen(false)
      await logout()
      navigate('/auth/register', { replace: true })
    } catch (err) {
      console.error('Failed to delete account:', err)
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to delete account. Please try again.')
    }
  }

  if (isLoading && !currentUser) {
    return (
      <>
        <Topbar />
        <div className={styles.page}>
          <div className={styles.empty}>Loading profile...</div>
        </div>
      </>
    )
  }

  if (!displayProfile) {
    return (
      <>
        <Topbar />
        <div className={styles.page}>
          <div className={styles.empty} style={{ flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', color: 'var(--ink-soft)' }}>User not found.</p>
            <Button variant="ghost" onClick={() => navigate('/library')}>← Back to Library</Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar />
      <div className={styles.page}>
        {/* Profile Card Header */}
        <div className={styles.profileCard}>
          <div className={styles.headerRow}>
            <div className={styles.userInfo}>
              {displayProfile.avatarUrl ? (
                <img src={displayProfile.avatarUrl} alt={displayProfile.name} className={styles.avatar} />
              ) : (
                <Avatar name={displayProfile.name} size="xl" />
              )}
              <div>
                <div className={styles.nameRow}>
                  <h1 className={styles.name}>{displayProfile.name}</h1>
                  {displayProfile.role && displayProfile.role !== 'STUDENT' && (
                    <Badge variant="kind" color="var(--primary)">{displayProfile.role}</Badge>
                  )}
                </div>
                <div className={styles.meta}>
                  {displayProfile.college && <span>🏫 {displayProfile.college}</span>}
                  {displayProfile.degree && <span>🎓 {displayProfile.degree}</span>}
                  {displayProfile.department && <span>📚 {displayProfile.department}</span>}
                  {displayProfile.year && <span>🗓️ Year {displayProfile.year}</span>}
                  {displayProfile.email && <span>✉️ {displayProfile.email}</span>}
                </div>
              </div>
            </div>

            {isOwnProfile && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="ghost" onClick={() => setEditModalOpen(true)}>
                  Edit Profile
                </Button>
                <Button variant="ghost" onClick={logout}>
                  Log Out
                </Button>
                <Button variant="ghost" onClick={() => setDeleteModalOpen(true)} style={{ color: 'var(--coral)' }}>
                  Delete Account
                </Button>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{displayProfile.uploadCount || 0}</div>
              <div className={styles.statLabel}>Uploads</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{displayProfile.postCount || 0}</div>
              <div className={styles.statLabel}>Posts</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{displayProfile.totalDownloadsReceived || 0}</div>
              <div className={styles.statLabel}>Downloads Recvd</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {(displayProfile.resourceBookmarkCount || 0) + (displayProfile.postBookmarkCount || 0)}
              </div>
              <div className={styles.statLabel}>Saved Items</div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'uploads'}
            className={`${styles.tab} ${activeTab === 'uploads' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('uploads')}
          >
            Uploads ({displayProfile.uploadCount || 0})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'posts'}
            className={`${styles.tab} ${activeTab === 'posts' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Community Posts ({displayProfile.postCount || 0})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'uploads' && (
          uploads.length > 0 ? (
            <div className={styles.grid}>
              {uploads.map((res) => (
                <ResourceCard key={`user-res-${res.id}`} resource={res} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>No resources uploaded yet.</p>
            </div>
          )
        )}

        {activeTab === 'posts' && (
          posts.length > 0 ? (
            <div className={styles.list}>
              {posts.map((post) => (
                <PostCard key={`user-post-${post.id}`} post={post} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p>No community posts created yet.</p>
            </div>
          )
        )}
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <>
          <EditProfileModal
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            profile={displayProfile}
          />

          <Modal
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            title="Delete Account"
            size="sm"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
              <p style={{ color: 'var(--ink-soft)', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to delete your account? This action is permanent and will permanently delete your profile, saved resources, and account details.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteAccountMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                  style={{ background: 'var(--coral)', color: '#ffffff', borderColor: 'transparent' }}
                >
                  {deleteAccountMutation.isPending ? 'Deleting Account...' : 'Confirm Delete'}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  )
}
