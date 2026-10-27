import api from './api.js'

const eventsService = {
  /**
   * Get paginated events list.
   * @param {Object} params - { type, page, size }
   */
  list: (params = {}) =>
    api.get('/events', { params }).then((r) => r.data.data),

  /** Get single event by ID. */
  getById: (id) =>
    api.get(`/events/${id}`).then((r) => r.data.data),

  /** Create a new event. */
  create: (payload) =>
    api.post('/events', payload).then((r) => r.data.data),

  /** Update an existing event. */
  update: (id, payload) =>
    api.put(`/events/${id}`, payload).then((r) => r.data.data),

  /** Delete an event. */
  delete: (id) =>
    api.delete(`/events/${id}`),

  /** Add a stage to an event. */
  addStage: (eventId, payload) =>
    api.post(`/events/${eventId}/stages`, payload).then((r) => r.data.data),

  /** Edit a stage. */
  editStage: (eventId, stageId, payload) =>
    api.put(`/events/${eventId}/stages/${stageId}`, payload).then((r) => r.data.data),

  /** Delete a stage. */
  deleteStage: (eventId, stageId) =>
    api.delete(`/events/${eventId}/stages/${stageId}`),

  /** Toggle save state on an event. */
  toggleSave: (id) =>
    api.post(`/events/${id}/save`).then((r) => r.data.data),

  /** Get user's saved events. */
  getSaved: (params = {}) =>
    api.get('/users/me/bookmarks/events', { params }).then((r) => r.data.data),
}

export default eventsService
