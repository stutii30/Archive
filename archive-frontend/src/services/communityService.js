import api from './api.js'

const communityService = {
  /**
   * Get paginated post feed.
   * @param {Object} params - { type, tag, resourceId, page, size }
   */
  list: (params = {}) =>
    api.get('/posts', { params }).then((r) => r.data.data),

  /** Get single post by ID. */
  getById: (id) =>
    api.get(`/posts/${id}`).then((r) => r.data.data),

  /** Get paginated replies for a post (includes nested). */
  getReplies: (postId, page = 0) =>
    api.get(`/posts/${postId}/replies`, { params: { page, size: 30 } })
      .then((r) => r.data.data),

  /** Create a new post. */
  create: (payload) =>
    api.post('/posts', payload).then((r) => r.data.data),

  /** Edit post title/body/tags. */
  update: (id, payload) =>
    api.put(`/posts/${id}`, payload).then((r) => r.data.data),

  /** Soft-delete a post. */
  delete: (id) =>
    api.delete(`/posts/${id}`),

  /** Add a reply (parentReplyId optional for nesting). */
  addReply: (postId, payload) =>
    api.post(`/posts/${postId}/replies`, payload).then((r) => r.data.data),

  /** Delete a reply. */
  deleteReply: (postId, replyId) =>
    api.delete(`/posts/${postId}/replies/${replyId}`),

  /** Toggle upvote — returns { upvoted: boolean }. */
  toggleUpvote: (id) =>
    api.post(`/posts/${id}/upvote`).then((r) => r.data.data),

  /** Toggle bookmark — returns { bookmarked: boolean }. */
  toggleBookmark: (id) =>
    api.post(`/posts/${id}/bookmark`).then((r) => r.data.data),

  /** Get trending tags (top 10, last 7 days). */
  trendingTags: () =>
    api.get('/posts/trending-tags').then((r) => r.data.data),

  /** Get user's bookmarked posts. */
  getBookmarked: (params = {}) =>
    api.get('/users/me/bookmarks/posts', { params }).then((r) => r.data.data),
}

export default communityService
