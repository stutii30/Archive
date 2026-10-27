import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { useUploadResource, useSubjects } from '../../hooks/useResources.js'
import useAuthStore from '../../store/authStore.js'
import { getDegreeDuration } from '../../utils/degreeConfig.js'
import styles from './UploadModal.module.css'

const RESOURCE_TYPES = [
  { value: 'NOTES',      label: 'Notes' },
  { value: 'PYQ',        label: 'Previous Year Questions (PYQ)' },
  { value: 'DSA',        label: 'DSA Problems' },
  { value: 'QA',         label: 'Q&A' },
  { value: 'LAB_MANUAL', label: 'Lab Manual' },
  { value: 'PLACEMENT',  label: 'Placement Resources' },
  { value: 'OTHER',      label: 'Other' },
]

const ALLOWED_EXTS = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * UploadModal — 2-step: Unified Upload & Details → Progress/Success
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {string}   [initialSubject] Pre-filled subject if passed
 */
export default function UploadModal({ open, onClose, initialSubject = '' }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Form & File, 2: Progress
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState(null)
  const [createdResource, setCreatedResource] = useState(null)
  const currentUser = useAuthStore((state) => state.user)
  const degreeDuration = getDegreeDuration(currentUser?.degree || 'B.Tech')
  const [metadata, setMetadata] = useState({
    title: '', type: 'NOTES', subject: initialSubject, degree: currentUser?.degree || 'B.Tech', semester: '', chapter: '', description: '',
  })
  const fileInputRef = useRef(null)
  const { mutate: upload } = useUploadResource()
  const { data: subjects = [] } = useSubjects()

  // Sync initialSubject when opened
  useEffect(() => {
    if (initialSubject) {
      setMetadata((m) => ({ ...m, subject: initialSubject }))
    }
  }, [initialSubject, open])

  // ── File selection helpers ─────────────────────────────────────────────────
  const acceptFile = useCallback((f) => {
    if (!f) return
    if (f.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds 50 MB limit.')
      return
    }
    setUploadError(null)
    setFile(f)
    setMetadata((m) => ({ ...m, title: m.title || f.name.replace(/\.[^.]+$/, '') }))
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    acceptFile(e.dataTransfer.files[0])
  }, [acceptFile])

  const isFormValid = Boolean(file && metadata.title.trim() && metadata.semester && metadata.subject?.trim())

  const doUpload = () => {
    if (!file || !metadata.title.trim()) {
      setUploadError('Please select a file and enter a title.')
      return
    }
    if (!metadata.semester) {
      setUploadError('Semester is required for uploading a resource.')
      return
    }
    if (!metadata.subject || !metadata.subject.trim()) {
      setUploadError('Subject is required for uploading a resource.')
      return
    }

    setStep(2)
    setProgress(0)
    setUploadError(null)

    const payloadMeta = {
      ...metadata,
      semester: Number(metadata.semester),
      department: metadata.department || currentUser?.department || '',
    }

    upload(
      { file, metadata: payloadMeta, onProgress: setProgress },
      {
        onSuccess: (res) => {
          setProgress(100)
          if (res) setCreatedResource(res)
        },
        onError: (err) => {
          const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Upload failed. Please try again.'
          setUploadError(msg)
          setStep(1)
        },
      },
    )
  }

  const handleClose = () => {
    setStep(1); setFile(null); setProgress(0); setUploadError(null); setCreatedResource(null)
    setMetadata({ title: '', type: 'NOTES', subject: '', semester: '', chapter: '', description: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={step === 1 ? 'Upload Resource' : 'Uploading…'} size="md">
      {/* ── Step 1: File selection + Metadata inputs on same page ────────── */}
      {step === 1 && (
        <div className={styles.stepContent}>
          {/* File Drop Zone */}
          <div
            className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${file ? styles.hasFile : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Drop file or click to browse"
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTS}
              className={styles.fileInput}
              onChange={(e) => acceptFile(e.target.files[0])}
            />

            {file ? (
              <div className={styles.filePreview}>
                <span className={styles.fileIcon} aria-hidden="true">📄</span>
                <div>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{formatSize(file.size)}</p>
                </div>
              </div>
            ) : (
              <div className={styles.dropPrompt}>
                <span className={styles.dropIcon} aria-hidden="true">☁</span>
                <p className={styles.dropTitle}>Drop your file here</p>
                <p className={styles.dropHint}>or click to browse · PDF, Word, PPT, images up to 50 MB</p>
              </div>
            )}
          </div>

          {/* Details Form */}
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="up-title">Title *</label>
              <input id="up-title" className={styles.input} type="text" maxLength={300}
                value={metadata.title} onChange={(e) => setMetadata((m) => ({ ...m, title: e.target.value }))}
                placeholder="e.g. OS Module 3 Notes" />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="up-type">Type</label>
                <select id="up-type" className={`${styles.input} ${styles.select}`}
                  value={metadata.type} onChange={(e) => setMetadata((m) => ({ ...m, type: e.target.value }))}>
                  {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="up-sem">Semester *</label>
                <select
                  id="up-sem"
                  className={`${styles.input} ${styles.select}`}
                  value={metadata.semester}
                  onChange={(e) => setMetadata((m) => ({ ...m, semester: e.target.value }))}
                >
                  <option value="">Select Semester</option>
                  {Array.from({ length: degreeDuration }, (_, idx) => {
                    const y = idx + 1
                    const suffix = y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'
                    const sem1 = (y * 2) - 1
                    const sem2 = y * 2
                    return (
                      <optgroup key={y} label={`${y}${suffix} Year`}>
                        <option value={String(sem1)}>Sem {sem1} ({y}${suffix} Year)</option>
                        <option value={String(sem2)}>Sem {sem2} ({y}${suffix} Year)</option>
                      </optgroup>
                    )
                  })}
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="up-subject">Subject *</label>
                <select
                  id="up-subject"
                  className={`${styles.input} ${styles.select}`}
                  value={metadata.subject}
                  onChange={(e) => setMetadata((m) => ({ ...m, subject: e.target.value }))}
                >
                  <option value="">Select a subject…</option>
                  {metadata.subject && !subjects.some((s) => (typeof s === 'object' ? s.name : s) === metadata.subject) && (
                    <option value={metadata.subject}>{metadata.subject}</option>
                  )}
                  {subjects.map((subj) => {
                    const name = typeof subj === 'object' ? subj.name : subj
                    const code = typeof subj === 'object' ? subj.code : null
                    const displayLabel = code ? `${name} (${code})` : name
                    const keyVal = typeof subj === 'object' ? (subj.id || subj.code) : subj
                    return (
                      <option key={keyVal} value={name}>
                        {displayLabel}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="up-chapter">Chapter / Unit</label>
                <input id="up-chapter" className={styles.input} type="text"
                  value={metadata.chapter} onChange={(e) => setMetadata((m) => ({ ...m, chapter: e.target.value }))}
                  placeholder="e.g. Scheduling Algorithms" />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="up-desc">Description</label>
              <textarea id="up-desc" className={`${styles.input} ${styles.textarea}`} rows={3}
                value={metadata.description} onChange={(e) => setMetadata((m) => ({ ...m, description: e.target.value }))}
                placeholder="Brief description of the resource content…" />
            </div>
          </div>

          {uploadError && <p className={styles.errorMsg} role="alert">{uploadError}</p>}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" disabled={!isFormValid} onClick={doUpload}>
              Upload Resource
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Progress / Success ────────────────────────────────────── */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <div className={styles.progressSection}>
            <div className={styles.filePreview}>
              <span className={styles.fileIcon} aria-hidden="true">📄</span>
              <div>
                <p className={styles.fileName}>{file?.name}</p>
                <p className={styles.fileSize}>{formatSize(file?.size ?? 0)}</p>
              </div>
            </div>

            <div className={styles.progressBar} role="progressbar"
              aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>

            <p className={styles.progressLabel}>
              {progress >= 100
                ? (createdResource?.status === 'PENDING_REVIEW' ? '⚠️ Upload Flagged for Admin Review' : '✓ Upload complete!')
                : `Uploading… ${progress}%`}
            </p>
          </div>

          {progress >= 100 && (
            <div className={styles.moderationNoticeSection}>
              {createdResource?.status === 'PENDING_REVIEW' && (
                <div className={styles.flaggedBanner}>
                  <span className={styles.bannerIcon}>⚠️</span>
                  <div>
                    <p className={styles.bannerTitle}>Flagged for Admin Review</p>
                    <p className={styles.bannerText}>
                      AI moderation detected potential unwanted or mismatched content. Your resource has been submitted to the Admin queue for review before public listing.
                    </p>
                  </div>
                </div>
              )}

              {createdResource?.aiNotice && (
                <div className={styles.statementBanner}>
                  <span className={styles.bannerIcon}>ℹ️</span>
                  <div>
                    <p className={styles.bannerTitle}>AI Content Notice</p>
                    <p className={styles.bannerText}>{createdResource.aiNotice}</p>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <Button variant="ghost" onClick={handleClose}>Close</Button>
                {createdResource?.id && createdResource?.status === 'APPROVED' && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      const resId = createdResource.id
                      handleClose()
                      navigate(`/library/${resId}`)
                    }}
                  >
                    View Resource →
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
