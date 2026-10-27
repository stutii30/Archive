import React, { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { useCreateSubject } from '../../hooks/useResources.js'
import useAuthStore from '../../store/authStore.js'
import styles from './CreateSubjectModal.module.css'

/**
 * CreateSubjectModal — Modal for creating a new subject with Name and Code.
 * Validates uniqueness via backend API.
 *
 * @param {boolean}  open    Controls modal visibility
 * @param {Function} onClose Called when user closes modal
 * @param {Function} onCreate Called with created subject object when user submits successfully
 */
export default function CreateSubjectModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const createSubjectMutation = useCreateSubject()
  const currentUser = useAuthStore((state) => state.user)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedCode = code.trim().toUpperCase()

    if (!trimmedName) {
      setError('Please enter a subject name.')
      return
    }
    if (!trimmedCode) {
      setError('Please enter a subject code (e.g. CS201).')
      return
    }

    setError('')

    try {
      const created = await createSubjectMutation.mutateAsync({
        name: trimmedName,
        code: trimmedCode,
        department: currentUser?.department || null,
        semester: currentUser?.year ? currentUser.year * 2 : null,
      })

      setName('')
      setCode('')
      if (onCreate) onCreate(created)
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to create subject.'
      setError(msg)
    }
  }

  const handleClose = () => {
    setError('')
    setName('')
    setCode('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create New Subject" size="md">
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.infoText}>
          Create a new academic subject by specifying its name and subject code. The code must be unique.
        </p>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="subject-name-input">
            Subject Name *
          </label>
          <input
            id="subject-name-input"
            type="text"
            className={styles.input}
            placeholder="e.g. Data Structures & Algorithms"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            autoFocus
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="subject-code-input">
            Subject Code *
          </label>
          <input
            id="subject-code-input"
            type="text"
            className={styles.input}
            placeholder="e.g. CS201, MATH101…"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              if (error) setError('')
            }}
            required
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim() || !code.trim() || createSubjectMutation.isPending}
          >
            {createSubjectMutation.isPending ? 'Creating…' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
