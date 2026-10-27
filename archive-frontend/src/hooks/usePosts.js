import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import communityService from '../services/communityService.js'

// ── Query keys ────────────────────────────────────────────────────────────────
export const POST_KEYS = {
  all:      () => ['posts'],
  feed:     (filters) => ['posts', 'feed', filters],
  detail:   (id) => ['posts', id],
  replies:  (id) => ['posts', id, 'replies'],
  trending: () => ['posts', 'trending-tags'],
}

// ── usePostFeed — infinite paginated feed ─────────────────────────────────────
export function usePostFeed(filters = {}) {
  const clean = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v != null),
  )
  return useInfiniteQuery({
    queryKey: POST_KEYS.feed(clean),
    queryFn: ({ pageParam = 0 }) =>
      communityService.list({ ...clean, page: pageParam, size: 20 }),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
  })
}

// ── usePost — single post detail ──────────────────────────────────────────────
export function usePost(id) {
  return useQuery({
    queryKey: POST_KEYS.detail(id),
    queryFn: () => communityService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

// ── useReplies — paginated replies ────────────────────────────────────────────
export function useReplies(postId) {
  return useInfiniteQuery({
    queryKey: POST_KEYS.replies(postId),
    queryFn: ({ pageParam = 0 }) => communityService.getReplies(postId, pageParam),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
    enabled: !!postId,
    staleTime: 1000 * 30,
  })
}

// ── useCreatePost ─────────────────────────────────────────────────────────────
export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => communityService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: POST_KEYS.all() }),
  })
}

// ── useDeletePost ─────────────────────────────────────────────────────────────
export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId) => communityService.delete(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: POST_KEYS.all() }),
  })
}

// ── useAddReply ───────────────────────────────────────────────────────────────
export function useAddReply(postId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => communityService.addReply(postId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POST_KEYS.replies(postId) })
      qc.invalidateQueries({ queryKey: POST_KEYS.detail(postId) })
    },
  })
}

// ── useDeleteReply ─────────────────────────────────────────────────────────────
export function useDeleteReply(postId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (replyId) => communityService.deleteReply(postId, replyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POST_KEYS.replies(postId) })
      qc.invalidateQueries({ queryKey: POST_KEYS.detail(postId) })
    },
  })
}

// ── useUpvotePost — optimistic ────────────────────────────────────────────────
export function useUpvotePost(postId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => communityService.toggleUpvote(postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: POST_KEYS.detail(postId) })
      const prev = qc.getQueryData(POST_KEYS.detail(postId))
      if (prev) {
        qc.setQueryData(POST_KEYS.detail(postId), {
          ...prev,
          upvoted: !prev.upvoted,
          upvoteCount: prev.upvoted ? prev.upvoteCount - 1 : prev.upvoteCount + 1,
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(POST_KEYS.detail(postId), ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: POST_KEYS.detail(postId) }),
  })
}

// ── useBookmarkPost — optimistic ──────────────────────────────────────────────
export function useBookmarkPost(postId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => communityService.toggleBookmark(postId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: POST_KEYS.detail(postId) })
      const prev = qc.getQueryData(POST_KEYS.detail(postId))
      if (prev) {
        qc.setQueryData(POST_KEYS.detail(postId), {
          ...prev,
          bookmarked: !prev.bookmarked,
          bookmarkCount: prev.bookmarked
            ? Math.max(0, (prev.bookmarkCount ?? 1) - 1)
            : (prev.bookmarkCount ?? 0) + 1,
        })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(POST_KEYS.detail(postId), ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: POST_KEYS.detail(postId) })
      qc.invalidateQueries({ queryKey: POST_KEYS.all() })
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })
}

// ── useTrendingTags ───────────────────────────────────────────────────────────
export function useTrendingTags() {
  return useQuery({
    queryKey: POST_KEYS.trending(),
    queryFn: communityService.trendingTags,
    staleTime: 1000 * 60 * 10,
  })
}
