import api from './api.js'

const notificationService = {
  /** Get paginated user notifications. */
  list: (params = {}) =>
    api.get('/notifications', { params }).then((r) => r.data.data),

  /** Get count of unread notifications. */
  unreadCount: () =>
    api.get('/notifications/unread-count').then((r) => r.data.data),

  /** Mark a single notification as read. */
  markRead: (id) =>
    api.post(`/notifications/${id}/read`).then((r) => r.data.data),

  /** Mark all notifications as read. */
  markAllRead: () =>
    api.post('/notifications/read-all').then((r) => r.data.data),
}

export default notificationService
