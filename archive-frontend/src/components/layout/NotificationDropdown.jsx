import { useNavigate } from 'react-router-dom'
import {
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../../hooks/useNotifications.js'
import styles from './NotificationDropdown.module.css'

export default function NotificationDropdown({ onClose }) {
  const navigate = useNavigate()
  const { data, isLoading } = useNotificationsList(0, 20)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = data?.content || []

  const handleItemClick = (item) => {
    if (!item.read) {
      markRead.mutate(item.id)
    }
    if (item.link) {
      navigate(item.link)
      onClose?.()
    }
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        {notifications.length > 0 && (
          <button
            type="button"
            className={styles.markAllBtn}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.empty}>Loading notifications…</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>No notifications yet</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`${styles.item} ${!item.read ? styles.unread : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.typeBadge}>{item.type}</span>
                <span className={styles.time}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className={styles.itemTitle}>{item.title}</div>
              {item.body && <div className={styles.itemBody}>{item.body}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
