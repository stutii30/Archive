import { keepPreviousData, useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import resourceService from '../services/resourceService.js'

// ── Query keys ────────────────────────────────────────────────────────────────
export const RESOURCE_KEYS = {
  all:      () => ['resources'],
  list:     (filters) => ['resources', 'list', filters],
  detail:   (id) => ['resources', id],
  subjects: (params) => ['resources', 'subjects', params],
}

export function useSubjects(params = {}) {
  return useQuery({
    queryKey: RESOURCE_KEYS.subjects(params),
    queryFn: () => resourceService.getSubjects(params),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => resourceService.createSubject(payload),
    onSuccess: () => {
      // Invalidate all subject-related queries (prefix match covers all param variants)
      queryClient.invalidateQueries({ queryKey: ['resources', 'subjects'] })
      // Also invalidate the full subjects key used by SubjectController route
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
    },
  })
}

export function useDeleteSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => resourceService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
      queryClient.invalidateQueries({ queryKey: ['resources', 'subjects'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
    },
  })
}

// ── useResourceList — infinite paginated feed ─────────────────────────────────

/**
 * @param {Object} filters - { type, subject, department, semester, chapter }
 */
export function useResourceList(filters = {}) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  )

  return useInfiniteQuery({
    queryKey: RESOURCE_KEYS.list(cleanFilters),
    queryFn: ({ pageParam }) =>
      resourceService.list({ ...cleanFilters, page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage?.last ? undefined : (lastPage?.number ?? 0) + 1,
    staleTime: 1000 * 60 * 2, // 2 min
    placeholderData: keepPreviousData,
  })
}

// ── useResource — single resource detail ─────────────────────────────────────

export function useResource(id) {
  return useQuery({
    queryKey: RESOURCE_KEYS.detail(id),
    queryFn: () => resourceService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// ── useResourceSearch ─────────────────────────────────────────────────────────

export function useResourceSearch(query) {
  return useInfiniteQuery({
    queryKey: ['resources', 'search', query],
    queryFn: ({ pageParam }) => resourceService.search(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage?.last ? undefined : (lastPage?.number ?? 0) + 1,
    enabled: !!query && query.length >= 2,
    staleTime: 1000 * 30,
  })
}

// ── useUploadResource — file upload mutation with progress ────────────────────

export function useUploadResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, metadata, onProgress }) =>
      resourceService.upload(file, metadata, onProgress),
    onSuccess: () => {
      // Invalidate all resource list queries
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
    },
  })
}

// ── useToggleBookmark — optimistic bookmark toggle ────────────────────────────

export function useToggleBookmark(resourceId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => resourceService.toggleBookmark(resourceId),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: RESOURCE_KEYS.detail(resourceId) })

      // Snapshot previous value
      const prev = queryClient.getQueryData(RESOURCE_KEYS.detail(resourceId))

      // Optimistically update
      if (prev) {
        queryClient.setQueryData(RESOURCE_KEYS.detail(resourceId), {
          ...prev,
          bookmarked: !prev.bookmarked,
          bookmarkCount: prev.bookmarked
            ? Math.max(0, (prev.bookmarkCount ?? 1) - 1)
            : (prev.bookmarkCount ?? 0) + 1,
        })
      }

      return { prev }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(RESOURCE_KEYS.detail(resourceId), context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.detail(resourceId) })
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

// ── useDownloadUrl — get presigned download URL ───────────────────────────────

export function useDownloadUrl() {
  const queryClient = useQueryClient()
  const pendingRef = useRef(false)

  return useCallback(async (id) => {
    // Guard against rapid double-clicks triggering multiple download count increments
    if (pendingRef.current) return
    pendingRef.current = true
    try {
      const url = await resourceService.getDownloadUrl(id)
      window.open(url, '_blank', 'noopener,noreferrer')
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
    } finally {
      // Reset after a short delay to allow re-download if needed
      setTimeout(() => { pendingRef.current = false }, 3000)
    }
  }, [queryClient])
}

// ── useRecommendedResources ───────────────────────────────────────────────────

export function useRecommendedResources() {
  return useQuery({
    queryKey: ['resources', 'recommended'],
    queryFn: () => resourceService.getRecommended(),
    staleTime: 1000 * 60 * 5,
  })
}

// ── useDeleteResource ────────────────────────────────────────────────────────

export function useDeleteResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => resourceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
    },
  })
}

// ── Reviews Hooks ─────────────────────────────────────────────────────────────

export function useResourceReviews(resourceId) {
  return useQuery({
    queryKey: ['resources', resourceId, 'reviews'],
    queryFn: () => resourceService.getReviews(resourceId),
    enabled: !!resourceId,
    staleTime: 1000 * 30,
  })
}

export function useAddReview(resourceId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => resourceService.addReview(resourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', resourceId, 'reviews'] })
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.detail(resourceId) })
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
    },
  })
}

export function useDeleteReview(resourceId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reviewId) => resourceService.deleteReview(resourceId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', resourceId, 'reviews'] })
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.detail(resourceId) })
    },
  })
}

// ── Admin Moderation Hooks ───────────────────────────────────────────────────

export function usePendingModeration(page = 0) {
  return useQuery({
    queryKey: ['admin', 'moderation', 'pending', page],
    queryFn: () => resourceService.getPendingModeration(page),
    staleTime: 1000 * 10,
  })
}

export function useApproveResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => resourceService.approveResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] })
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
    },
  })
}

export function useRejectResource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => resourceService.rejectResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] })
      queryClient.invalidateQueries({ queryKey: RESOURCE_KEYS.all() })
    },
  })
}
