import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import eventsService from '../services/eventsService.js'

export const EVENT_KEYS = {
  all:    () => ['events'],
  list:   (filters) => ['events', 'list', filters],
  detail: (id) => ['events', id],
}

export function useEventList(filters = {}) {
  const clean = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v != null)
  )
  return useQuery({
    queryKey: EVENT_KEYS.list(clean),
    queryFn: () => eventsService.list(clean),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  })
}

export function useEvent(id) {
  return useQuery({
    queryKey: EVENT_KEYS.detail(id),
    queryFn: () => eventsService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => eventsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENT_KEYS.all() }),
  })
}

export function useUpdateEvent(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => eventsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: EVENT_KEYS.all() })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => eventsService.delete(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: EVENT_KEYS.detail(id) })
      qc.invalidateQueries({ queryKey: EVENT_KEYS.all() })
    },
  })
}

export function useSavedEvents() {
  return useQuery({
    queryKey: ['bookmarks', 'events'],
    queryFn: () => eventsService.getSaved(),
    placeholderData: keepPreviousData,
  })
}

export function useSaveEvent(eventId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => eventsService.toggleSave(eventId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: EVENT_KEYS.detail(eventId) })
      const prev = qc.getQueryData(EVENT_KEYS.detail(eventId))
      if (prev) {
        qc.setQueryData(EVENT_KEYS.detail(eventId), {
          ...prev,
          saved: !prev.saved,
          registrantCount: prev.saved ? Math.max(0, prev.registrantCount - 1) : prev.registrantCount + 1,
        })
      }
      return { prev }
    },
    onError: (_err, _var, ctx) => {
      if (ctx?.prev) qc.setQueryData(EVENT_KEYS.detail(eventId), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: EVENT_KEYS.detail(eventId) })
      qc.invalidateQueries({ queryKey: EVENT_KEYS.all() })
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}
