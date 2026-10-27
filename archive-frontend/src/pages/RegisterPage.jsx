import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth.js'
import { DEGREE_OPTIONS, getDegreeDuration } from '../utils/degreeConfig.js'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { degree: 'B.Tech', year: '1' } })

  const selectedDegree = watch('degree')
  const degreeDuration = getDegreeDuration(selectedDegree || 'B.Tech')

  const onSubmit = async (data) => {
    setServerError(null)
    const formattedData = {
      ...data,
      year: data.year ? Number(data.year) : undefined,
    }

    try {
      await registerUser(formattedData)
      navigate('/library', { replace: true })
    } catch (err) {
      setServerError(err.response?.data?.error ?? 'Registration failed. Please try again.')
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob1} aria-hidden="true" />
      <div className={styles.blob2} aria-hidden="true" />

      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.brand}>
          <div className={styles.brandTabs}>
            <div className={`${styles.tab} ${styles.tab1}`} />
            <div className={`${styles.tab} ${styles.tab2}`} />
            <div className={`${styles.tab} ${styles.tab3}`} />
          </div>
          <span className={styles.brandName}>Archive</span>
        </div>

        <h1 className={styles.heading}>Create your account</h1>
        <p className={styles.subheading}>Join your campus community</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="reg-name" className={styles.label}>Full name</label>
            <input
              id="reg-name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              placeholder="Rohan Sharma"
              autoComplete="name"
              {...register('name', { required: 'Name is required', maxLength: { value: 100, message: 'Max 100 chars' } })}
            />
            {errors.name && <span className={styles.fieldError}>{errors.name.message}</span>}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="reg-email" className={styles.label}>Email</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className={styles.label}>Password</label>
            <input
              id="reg-password"
              type="password"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
            {errors.password && <span className={styles.fieldError}>{errors.password.message}</span>}
          </div>

          {/* Two-column row: College + Degree */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="reg-college" className={styles.label}>College</label>
              <input
                id="reg-college"
                type="text"
                className={styles.input}
                placeholder="IIT Bombay"
                {...register('college', { maxLength: { value: 150, message: 'Max 150 chars' } })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-degree" className={styles.label}>Degree / Program</label>
              <select
                id="reg-degree"
                className={`${styles.input} ${styles.select}`}
                {...register('degree', { required: 'Degree is required' })}
              >
                <option value="">Select degree</option>
                {DEGREE_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {errors.degree && <span className={styles.fieldError}>{errors.degree.message}</span>}
            </div>
          </div>

          {/* Two-column row: Department + Year of study */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="reg-department" className={styles.label}>Department / Branch</label>
              <input
                id="reg-department"
                type="text"
                className={styles.input}
                placeholder="e.g. Computer Science, Finance, Law"
                {...register('department', { maxLength: { value: 100, message: 'Max 100 chars' } })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-year" className={styles.label}>Year of study</label>
              <select
                id="reg-year"
                className={`${styles.input} ${styles.select}`}
                {...register('year', { required: 'Year of study is required' })}
              >
                <option value="">Select year</option>
                {Array.from({ length: degreeDuration }, (_, i) => i + 1).map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
              {errors.year && <span className={styles.fieldError}>{errors.year.message}</span>}
            </div>
          </div>

          {serverError && (
            <div className={styles.serverError} role="alert">{serverError}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitBtn}
            id="register-submit"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link to="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
