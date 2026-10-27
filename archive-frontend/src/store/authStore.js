import { create } from 'zustand'
import api from '../services/api.js'

/**
 * Auth store — holds the authenticated user and access token.
 * Token is also persisted to localStorage so page refreshes don't log users out.
 */
const getInitialUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem('authUser')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  accessToken: typeof window !== 'undefined' ? (localStorage.getItem('accessToken') ?? null) : null,

  setAuth: (user, token) => {
    if (token) localStorage.setItem('accessToken', token)
    if (user) localStorage.setItem('authUser', JSON.stringify(user))
    set({ user, accessToken: token })
    if (typeof window !== 'undefined') window.__archiveAuthStore__ = useAuthStore.getState()
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('authUser')
    if (api?.defaults?.headers?.common) {
      delete api.defaults.headers.common.Authorization
    }
    set({ user: null, accessToken: null })
    if (typeof window !== 'undefined') window.__archiveAuthStore__ = useAuthStore.getState()
  },
}))

// Expose store state on window so api.js can access it without circular imports
if (typeof window !== 'undefined') {
  window.__archiveAuthStore__ = useAuthStore.getState()
}

export default useAuthStore
