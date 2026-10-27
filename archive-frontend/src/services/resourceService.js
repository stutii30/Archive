import api from './api.js'

/**
 * resourceService — all API calls for the resource module.
 */
const resourceService = {
  /**
   * Get paginated list of resources with optional filters.
   * @param {Object} params - { type, subject, department, semester, chapter, page, size }
   */
  list: (params = {}) =>
    api.get('/resources', { params }).then((r) => r.data.data),

  /**
   * Get all persistent subjects.
   */
  getSubjects: async (params = {}) => {
    try {
      const res = await api.get('/subjects', { params })
      return res.data.data
    } catch {
      try {
        const fallback = await api.get('/resources/subjects', { params })
        return fallback.data.data
      } catch {
        return []
      }
    }
  },

  /**
   * Create a new subject with name and code.
   * @param {Object} payload - { name, code }
   */
  createSubject: async (payload) => {
    // Primary endpoint — /api/subjects (SubjectController)
    try {
      const res = await api.post('/subjects', payload)
      return res.data.data
    } catch (err) {
      // If 400 (validation / duplicate code), throw immediately so the modal shows the error
      if (err.response?.status === 400 || err.response?.status === 409) {
        throw err
      }
      // For other errors (e.g. 5xx), try the legacy /api/resources/subjects route
      const fallback = await api.post('/resources/subjects', payload)
      return fallback.data.data
    }
  },

  /**
   * Delete a subject by ID (creator or admin).
   * @param {number|string} id
   */
  deleteSubject: (id) =>
    api.delete(`/subjects/${id}`),

  /**
   * Get a single resource by ID.
   */
  getById: (id) =>
    api.get(`/resources/${id}`).then((r) => r.data.data),

  /**
   * Full-text search.
   * @param {string} q
   * @param {number} page
   */
  search: (q, page = 0) =>
    api.get('/resources/search', { params: { q, page } }).then((r) => r.data.data),

  /**
   * Upload a resource (multipart/form-data).
   * @param {File}     file          - The file to upload
   * @param {Object}   metadata      - ResourceMetadataRequest fields
   * @param {Function} onProgress    - Called with percent 0-100
   */
  upload: (file, metadata, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))

    const token = localStorage.getItem('accessToken')
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return api
      .post('/resources', formData, {
        headers,
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        },
      })
      .then((r) => r.data.data)
  },

  /**
   * Update resource metadata (author only).
   */
  update: (id, metadata) =>
    api.put(`/resources/${id}`, metadata).then((r) => r.data.data),

  /**
   * Soft-delete a resource.
   */
  delete: (id) =>
    api.delete(`/resources/${id}`),

  /**
   * Toggle bookmark — returns { bookmarked: boolean }.
   */
  toggleBookmark: (id) =>
    api.post(`/resources/${id}/bookmark`).then((r) => r.data.data),

  /**
   * Get user's bookmarked resources.
   */
  getBookmarked: (params = {}) =>
    api.get('/users/me/bookmarks/resources', { params }).then((r) => r.data.data),

  /**
   * Get presigned download URL — returns { downloadUrl }.
   */
  getDownloadUrl: (id) =>
    api.post(`/resources/${id}/download`).then((r) => r.data.data.downloadUrl),

  /**
   * Get recommended resources.
   */
  getRecommended: () =>
    api.get('/resources/recommended').then((r) => r.data.data),

  /**
   * Reviews and Ratings API.
   */
  getReviews: (id, page = 0) =>
    api.get(`/resources/${id}/reviews`, { params: { page } }).then((r) => r.data.data),

  addReview: (id, { rating, comment }) =>
    api.post(`/resources/${id}/reviews`, { rating, comment }).then((r) => r.data.data),

  deleteReview: (id, reviewId) =>
    api.delete(`/resources/${id}/reviews/${reviewId}`),

  /**
   * Admin Moderation Queue API
   */
  getPendingModeration: (page = 0) =>
    api.get('/admin/moderation/pending', { params: { page } }).then((r) => r.data.data),

  approveResource: (id) =>
    api.post(`/admin/moderation/${id}/approve`).then((r) => r.data.data),

  rejectResource: (id) =>
    api.post(`/admin/moderation/${id}/reject`).then((r) => r.data.data),
}

export default resourceService
