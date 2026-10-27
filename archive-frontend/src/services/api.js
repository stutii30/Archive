import axios from 'axios'

// ── Axios instance ──────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // needed for HttpOnly refresh-token cookie
})

// ── Auth store accessor (avoids circular import — store imported lazily via getter) ──
// We use a getter pattern so the store is read at call-time, not at module parse time.
function getAuthStore() {
  // Lazily require the store module only when needed
  // This works because Zustand store is a singleton and the module is already cached
  try {
    // eslint-disable-next-line no-undef
    return window.__archiveAuthStore__
  } catch {
    return null
  }
}

// ── Request interceptor — attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }

    // When sending FormData, ensure Content-Type is unset so browser / Axios automatically sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      if (config.headers?.delete) {
        config.headers.delete('Content-Type')
      } else if (config.headers) {
        delete config.headers['Content-Type']
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor — handle 401 / token refresh ──────────────────────────
let isRefreshing = false
let pendingRequests = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const reqUrl = originalRequest?.url || ''
    const isAuthEndpoint = reqUrl.includes('/auth/login') ||
                           reqUrl.includes('/auth/refresh') ||
                           reqUrl.includes('/auth/register') ||
                           reqUrl.includes('/auth/forgot-password')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data?.data?.accessToken
        const newUser = data?.data?.user

        if (newToken) {
          localStorage.setItem('accessToken', newToken)
          // Update Zustand store if available
          const store = getAuthStore()
          if (store) store.setAuth(newUser, newToken)

          api.defaults.headers.common.Authorization = `Bearer ${newToken}`
          pendingRequests.forEach(({ resolve }) => resolve(newToken))
          pendingRequests = []
          return api(originalRequest)
        }
      } catch (_err) {
        pendingRequests.forEach(({ reject }) => reject(_err))
        pendingRequests = []
        localStorage.removeItem('accessToken')
        delete api.defaults.headers.common.Authorization
        const store = getAuthStore()
        if (store) store.logout()
        window.location.href = '/auth/login'
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
