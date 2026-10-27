import React, { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import StageBuilder from './StageBuilder.jsx'
import TimelineView from './TimelineView.jsx'
import { useCreateEvent } from '../../hooks/useEvents.js'
import styles from './CreateEventModal.module.css'

const EVENT_TYPES = [
  { value: 'HACKATHON', label: 'Hackathon' },
  { value: 'FEST', label: 'Fest' },
  { value: 'PLACEMENT', label: 'Placement Drive' },
  { value: 'CONTEST', label: 'Contest' },
  { value: 'SEMINAR', label: 'Seminar / Talk' },
  { value: 'OTHER', label: 'Other' },
]

export default function CreateEventModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    type: 'HACKATHON',
    organizer: '',
    location: '',
    startDate: '',
    endDate: '',
    registrationLink: '',
    description: '',
    stages: [],
  })
  const [error, setError] = useState('')

  const createEventMutation = useCreateEvent()

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title.trim()) {
        setError('Please provide an event title.')
        return
      }
    }
    setError('')
    setStep((s) => Math.min(3, s + 1))
  }

  const handleBack = () => {
    setError('')
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      // Format stage dates if needed
      const payload = {
        ...formData,
        stages: formData.stages.map((s) => ({
          title: s.title,
          description: s.description,
          startDt: s.startDt ? s.startDt : null,
          endDt: s.endDt ? s.endDt : null,
        })),
      }

      const created = await createEventMutation.mutateAsync(payload)
      // Reset form
      setFormData({
        title: '',
        type: 'HACKATHON',
        organizer: '',
        location: '',
        startDate: '',
        endDate: '',
        registrationLink: '',
        description: '',
        stages: [],
      })
      setStep(1)
      onClose()
      if (onCreated) onCreated(created)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create event.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Host an Event" size="lg">
      <div className={styles.container}>
        {/* Step Indicator */}
        <div className={styles.stepsRow}>
          <div className={`${styles.stepChip} ${step === 1 ? styles.activeStep : ''} ${step > 1 ? styles.completedStep : ''}`}>
            1. Info
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepChip} ${step === 2 ? styles.activeStep : ''} ${step > 2 ? styles.completedStep : ''}`}>
            2. Timeline
          </div>
          <div className={styles.stepDivider} />
          <div className={`${styles.stepChip} ${step === 3 ? styles.activeStep : ''}`}>
            3. Preview
          </div>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className={styles.formSection}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Event Title *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. HackArchive 2026"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Event Category</label>
                <select
                  className={styles.select}
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Organizer / Society</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ACM Student Chapter"
                  value={formData.organizer}
                  onChange={(e) => handleInputChange('organizer', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Start Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>End Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Location / Venue</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. Main Auditorium / Online"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Registration Link</label>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="https://..."
                  value={formData.registrationLink}
                  onChange={(e) => handleInputChange('registrationLink', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Description &amp; Guidelines</label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Give students a brief summary of what this event is about..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Stages Builder */}
        {step === 2 && (
          <StageBuilder
            stages={formData.stages}
            eventStartDate={formData.startDate}
            eventEndDate={formData.endDate}
            onChange={(stages) => handleInputChange('stages', stages)}
          />
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className={styles.previewSection}>
            <div className={styles.previewHeader}>
              <span className={`${styles.typeBadge} mono`}>{formData.type}</span>
              <h3 className={styles.previewTitle}>{formData.title || 'Untitled Event'}</h3>
              {formData.organizer && <p className={styles.previewSub}>by {formData.organizer}</p>}
            </div>

            {formData.description && (
              <p className={styles.previewDesc}>{formData.description}</p>
            )}

            <div className={styles.timelinePreviewHeader}>
              Timeline Preview ({formData.stages.length} stages)
            </div>
            <TimelineView stages={formData.stages} />
          </div>
        )}

        {/* Modal Controls */}
        <div className={styles.footerActions}>
          {step > 1 ? (
            <button type="button" className={styles.btnGhost} onClick={handleBack}>
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button type="button" className={styles.btnPrimary} onClick={handleNext}>
              Next Step
            </button>
          ) : (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? 'Publishing...' : 'Publish Event'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
