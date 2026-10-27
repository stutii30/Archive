import { useState, useEffect } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import { useUpdateProfile, useUploadAvatar } from '../../hooks/useUserProfile.js'
import { DEGREE_OPTIONS, getDegreeDuration } from '../../utils/degreeConfig.js'
import styles from './EditProfileModal.module.css'

export default function EditProfileModal({ open, onClose, profile }) {
  const [name, setName] = useState('')
  const [college, setCollege] = useState('')
  const [degree, setDegree] = useState('')
  const [department, setDepartment] = useState('')
  const [year, setYear] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadAvatar()

  const degreeDuration = getDegreeDuration(degree || 'B.Tech')

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setCollege(profile.college || '')
      setDegree(profile.degree || 'B.Tech')
      setDepartment(profile.department || '')
      setYear(profile.year ? String(profile.year) : '')
      setPreviewUrl(profile.avatarUrl || '')
    }
  }, [profile, open])

  const handleDegreeChange = (newDegree) => {
    setDegree(newDegree)
    const newDuration = getDegreeDuration(newDegree)
    if (year && parseInt(year, 10) > newDuration) {
      setYear(String(newDuration))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (avatarFile) {
        await uploadAvatarMutation.mutateAsync(avatarFile)
      }
      await updateProfileMutation.mutateAsync({
        name,
        college,
        degree,
        department,
        year: year ? parseInt(year, 10) : null,
      })
      onClose()
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  const isLoading = updateProfileMutation.isPending || uploadAvatarMutation.isPending

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Avatar change */}
        <div className={styles.avatarSection}>
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar preview" className={styles.avatarPreview} />
          ) : (
            <Avatar name={name || 'User'} size="lg" />
          )}
          <div>
            <label className={styles.label}>Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Name */}
        <div className={styles.field}>
          <label className={styles.label}>Full Name</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* College */}
        <div className={styles.field}>
          <label className={styles.label}>College / Institution</label>
          <input
            type="text"
            className={styles.input}
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="e.g. National Institute of Technology"
          />
        </div>

        {/* Degree */}
        <div className={styles.field}>
          <label className={styles.label}>Degree / Program</label>
          <select
            className={styles.select}
            value={degree}
            onChange={(e) => handleDegreeChange(e.target.value)}
          >
            <option value="">Select Degree</option>
            {DEGREE_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div className={styles.field}>
          <label className={styles.label}>Department / Branch</label>
          <input
            type="text"
            className={styles.input}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science & Engineering, Finance"
          />
        </div>

        {/* Year */}
        <div className={styles.field}>
          <label className={styles.label}>Academic Year</label>
          <select
            className={styles.select}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">Select Year</option>
            {Array.from({ length: degreeDuration }, (_, i) => i + 1).map((y) => (
              <option key={y} value={String(y)}>
                {y === 1 ? '1st' : y === 2 ? '2nd' : y === 3 ? '3rd' : `${y}th`} Year
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
