import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import api from '../services/api.js'
import useAuthStore from '../store/authStore.js'

/**
 * useAuth — wraps auth store + API calls.
 * Returns login, register, logout, fetchMe functions.
 */
export function useAuth() {
  const { user, accessToken, setAuth, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const login = useCallback(async (email, password) => {
    queryClient.clear()
    const { data } = await api.post('/auth/login', { email, password })
    const { accessToken: token, user: userData } = data.data
    setAuth(userData, token)
    return userData
  }, [setAuth, queryClient])

  const register = useCallback(async (formData) => {
    queryClient.clear()
    const { data } = await api.post('/auth/register', formData)
    const { accessToken: token, user: userData } = data.data
    setAuth(userData, token)
    return userData
  }, [setAuth, queryClient])

  const sendForgotPasswordOtp = useCallback(async (email) => {
    const { data } = await api.post('/auth/forgot-password/send-otp', { email })
    return data.data
  }, [])

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    const { data } = await api.post('/auth/forgot-password/reset', { email, otp, newPassword })
    return data.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore — we clear local state regardless
    }
    queryClient.clear()
    storeLogout()
    navigate('/auth/login', { replace: true })
  }, [storeLogout, navigate, queryClient])

  const fetchMe = useCallback(async () => {
    const { data } = await api.get('/auth/me')
    const userData = data.data
    // Refresh user data in store without changing the token
    setAuth(userData, accessToken)
    return userData
  }, [setAuth, accessToken])

  return {
    user,
    accessToken,
    isAuthenticated: !!user,
    login,
    register,
    sendForgotPasswordOtp,
    resetPassword,
    logout,
    fetchMe,
  }
}
