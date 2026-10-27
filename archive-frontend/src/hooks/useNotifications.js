import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import notificationService from '../services/notificationService.js'

export const NOTIFICATION_KEYS = {
  all: () => ['notifications'],
  list: (page) => ['notifications', 'list', page],
  unreadCount: () => ['notifications', 'unread-count'],
}

export function useNotificationsList(page = 0, size = 20) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page),
    queryFn: () => notificationService.list({ page, size }),
    refetchInterval: 30000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 15000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all() })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all() })
    },
  })
}
