import api from './api'

export const searchService = {
  search: async ({ q = '', scope = 'all' }) => {
    const res = await api.get('/search', { params: { q, scope } })
    return res.data.data
  },
}
