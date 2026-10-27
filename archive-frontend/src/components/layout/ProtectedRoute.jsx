import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore.js'

/**
 * ProtectedRoute — wraps routes that require authentication.
 * If user is not in the auth store, redirect to /auth/login.
 * Saves the current location so we can redirect back after login.
 */
export default function ProtectedRoute({ children }) {
  const { user, accessToken } = useAuthStore()
  const location = useLocation()

  if (!user && !accessToken) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return children
}
