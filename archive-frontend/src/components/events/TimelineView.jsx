import React from 'react'
import styles from './TimelineView.module.css'

export default function TimelineView({ stages = [] }) {
  if (!stages || stages.length === 0) {
    return (
      <div className={styles.noTimeline}>
        <p>No timeline stages announced yet.</p>
      </div>
    )
  }

  const formatStageDates = (startDt, endDt) => {
    if (!startDt) return null
    const start = new Date(startDt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    if (!endDt) return start
    const end = new Date(endDt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return `${start} — ${end}`
  }

  return (
    <div className={styles.timeline}>
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1
        const dateRange = formatStageDates(stage.startDt, stage.endDt)

        return (
          <div key={stage.id || idx} className={styles.timelineItem}>
            <div className={styles.leftCol}>
              <div className={styles.dot} />
              {!isLast && <div className={styles.line} />}
            </div>

            <div className={styles.contentCol}>
              <div className={styles.stageHeader}>
                <span className={`${styles.stageNumber} mono`}>
                  STAGE {stage.stageNumber || idx + 1}
                </span>
                {dateRange && (
                  <span className={`${styles.stageDate} mono`}>
                    {dateRange}
                  </span>
                )}
              </div>
              <h4 className={styles.stageTitle}>{stage.title}</h4>
              {stage.description && (
                <p className={styles.stageDescription}>{stage.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
