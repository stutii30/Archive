import React from 'react'
import styles from './StageBuilder.module.css'

export default function StageBuilder({ stages = [], eventStartDate, eventEndDate, onChange }) {
  const handleAddStage = () => {
    const newStage = {
      title: '',
      description: '',
      startDt: eventStartDate ? `${eventStartDate}T09:00` : '',
      endDt: eventEndDate ? `${eventEndDate}T17:00` : '',
    }
    onChange([...stages, newStage])
  }

  const handleRemoveStage = (index) => {
    const updated = stages.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleChange = (index, field, value) => {
    const updated = stages.map((s, i) => {
      if (i === index) {
        return { ...s, [field]: value }
      }
      return s
    })
    onChange(updated)
  }

  const handleMove = (index, direction) => {
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= stages.length) return
    const updated = [...stages]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    onChange(updated)
  }

  return (
    <div className={styles.builder}>
      <div className={styles.builderHeader}>
        <h4 className={styles.title}>Timeline Stages</h4>
        <button type="button" className={styles.addBtn} onClick={handleAddStage}>
          + Add Stage
        </button>
      </div>

      {stages.length === 0 ? (
        <p className={styles.emptyText}>No stages added yet. Add stages to build a vertical timeline for your event!</p>
      ) : (
        <div className={styles.stageList}>
          {stages.map((stage, idx) => (
            <div key={idx} className={styles.stageCard}>
              <div className={styles.stageCardHeader}>
                <span className={`${styles.stageBadge} mono`}>Stage {idx + 1}</span>
                <div className={styles.reorderBtns}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === stages.length - 1}
                    title="Move down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.danger}`}
                    onClick={() => handleRemoveStage(idx)}
                    title="Remove stage"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Stage Title *</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Round 1: Submission"
                    value={stage.title}
                    onChange={(e) => handleChange(idx, 'title', e.target.value)}
                    required
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Start Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      className={styles.input}
                      value={stage.startDt}
                      onChange={(e) => handleChange(idx, 'startDt', e.target.value)}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>End Date &amp; Time</label>
                    <input
                      type="datetime-local"
                      className={styles.input}
                      value={stage.endDt}
                      onChange={(e) => handleChange(idx, 'endDt', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Stage details, deliverables, guidelines..."
                    rows={2}
                    value={stage.description}
                    onChange={(e) => handleChange(idx, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
