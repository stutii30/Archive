import api from './api'

export const userService = {
  getProfile: async (userId) => {
    const isValidId = userId && userId !== 'undefined' && userId !== 'null'
    const endpoint = isValidId ? `/users/${userId}` : '/users/me'
    const res = await api.get(endpoint)
    return res.data.data
  },

  updateProfile: async (data) => {
    const res = await api.put('/users/me', data)
    return res.data.data
  },

  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('accessToken')
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const res = await api.post('/users/me/avatar', formData, { headers })
    return res.data.data
  },

  getUserUploads: async (userId, page = 0, size = 20) => {
    const isValidId = userId && userId !== 'undefined' && userId !== 'null'
    if (!isValidId) return { content: [] }
    const res = await api.get(`/users/${userId}/uploads`, { params: { page, size } })
    return res.data.data
  },

  getUserPosts: async (userId, page = 0, size = 20) => {
    const isValidId = userId && userId !== 'undefined' && userId !== 'null'
    if (!isValidId) return { content: [] }
    const res = await api.get(`/users/${userId}/posts`, { params: { page, size } })
    return res.data.data
  },

  deleteAccount: async () => {
    const res = await api.delete('/users/me')
    return res.data.data
  },
}
