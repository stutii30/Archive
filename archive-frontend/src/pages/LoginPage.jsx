import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth.js'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const { login, sendForgotPasswordOtp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/library'

  const [serverError, setServerError] = useState(null)
  const [passwordError, setPasswordError] = useState(null)

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Send OTP, 2: Reset password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotMsg, setForgotMsg] = useState(null)
  const [forgotErr, setForgotErr] = useState(null)
  const [isForgotLoading, setIsForgotLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ email, password }) => {
    setServerError(null)
    setPasswordError(null)
    try {
      await login(email ? email.trim().toLowerCase() : '', password)
      navigate(from, { replace: true })
    } catch (err) {
      const errMsg = err.response?.data?.error ||
                     err.response?.data?.message ||
                     (err.response?.status === 401 ? 'Invalid email or password. Please check your credentials or register.' : null) ||
                     'Login failed. Please try again.'

      if (errMsg.toLowerCase().includes('password')) {
        setPasswordError(errMsg)
      } else {
        setServerError(errMsg)
      }
    }
  }

  // Handle forgot password step 1 (Send OTP)
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setForgotErr(null)
    setForgotMsg(null)
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotErr('Please enter a valid email address.')
      return
    }
    setIsForgotLoading(true)
    try {
      await sendForgotPasswordOtp(forgotEmail)
      setForgotMsg('OTP reset code sent to your email!')
      setForgotStep(2)
    } catch (err) {
      setForgotErr(err.response?.data?.error ?? 'Failed to send reset code. Please try again.')
    } finally {
      setIsForgotLoading(false)
    }
  }

  // Handle forgot password step 2 (Verify OTP & Reset Password)
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setForgotErr(null)
    setForgotMsg(null)
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotErr('Please enter the 6-digit OTP code.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setForgotErr('Password must be at least 8 characters long.')
      return
    }
    setIsForgotLoading(true)
    try {
      await resetPassword(forgotEmail, forgotOtp.trim(), newPassword)
      setForgotMsg('Password reset successfully! You can now sign in.')
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotStep(1)
        setForgotEmail('')
        setForgotOtp('')
        setNewPassword('')
        setForgotMsg(null)
      }, 2000)
    } catch (err) {
      setForgotErr(err.response?.data?.error ?? 'Failed to reset password. Please check your code.')
    } finally {
      setIsForgotLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Decorative background blobs */}
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      <div className={styles.card}>
        {/* Brand mark */}
        <div className={styles.brand}>
          <div className={styles.brandTabs}>
            <div className={`${styles.tab} ${styles.tab1}`} />
            <div className={`${styles.tab} ${styles.tab2}`} />
            <div className={`${styles.tab} ${styles.tab3}`} />
          </div>
          <span className={styles.brandName}>Archive</span>
        </div>

        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.subheading}>Sign in to your campus resource hub</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>Email</label>
            <input
              id="login-email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="you@college.edu"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <span className={styles.fieldError}>{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label htmlFor="login-password" className={styles.label}>Password</label>
              <button
                type="button"
                className={styles.forgotBtn}
                onClick={() => {
                  setShowForgotModal(true)
                  setForgotStep(1)
                  setForgotErr(null)
                  setForgotMsg(null)
                }}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              className={`${styles.input} ${errors.password || passwordError ? styles.inputError : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
            {passwordError && <span className={styles.fieldError}>{passwordError}</span>}
          </div>

          {/* Server error */}
          {serverError && (
            <div className={styles.serverError} role="alert">{serverError}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
            id="login-submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Don&apos;t have an account?{' '}
          <Link to="/auth/register">Create one</Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setShowForgotModal(false)}
              aria-label="Close"
            >
              ×
            </button>

            <h2 className={styles.heading} style={{ fontSize: '20px' }}>Forgot Password</h2>
            <p className={styles.subheading}>
              {forgotStep === 1
                ? 'Enter your registered email address to receive a 6-digit reset code.'
                : 'Enter the 6-digit OTP code sent to your email and your new password.'}
            </p>

            {forgotMsg && <div className={styles.successBox}>{forgotMsg}</div>}
            {forgotErr && <div className={styles.serverError} style={{ marginTop: '8px' }}>{forgotErr}</div>}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className={styles.form} style={{ marginTop: '12px' }}>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    placeholder="you@college.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className={styles.submitBtn}
                >
                  {isForgotLoading ? 'Sending Code…' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className={styles.form} style={{ marginTop: '12px' }}>
                <div className={styles.field}>
                  <label className={styles.label}>6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    className={`${styles.input} ${styles.otpInput}`}
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>New Password</label>
                  <input
                    type="password"
                    className={styles.input}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className={styles.submitBtn}
                >
                  {isForgotLoading ? 'Resetting Password…' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  className={styles.forgotBtn}
                  style={{ marginTop: '8px', textAlign: 'center', width: '100%' }}
                  onClick={() => setForgotStep(1)}
                >
                  Resend OTP / Change Email
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
