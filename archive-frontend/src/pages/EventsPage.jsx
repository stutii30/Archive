import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar.jsx'
import EventStrip from '../components/events/EventStrip.jsx'
import EventDetailPanel from '../components/events/EventDetailPanel.jsx'
import CreateEventModal from '../components/events/CreateEventModal.jsx'
import { useEventList, useEvent } from '../hooks/useEvents.js'
import styles from './EventsPage.module.css'

const EVENT_CATEGORIES = [
  { value: '', label: 'All Events' },
  { value: 'HACKATHON', label: 'Hackathons' },
  { value: 'FEST', label: 'Fests' },
  { value: 'PLACEMENT', label: 'Placement Drives' },
  { value: 'CONTEST', label: 'Contests' },
  { value: 'SEMINAR', label: 'Seminars' },
]

export default function EventsPage() {
  const { id: routeEventId } = useParams()
  const navigate = useNavigate()
  const detailSectionRef = useRef(null)

  const [activeCategory, setActiveCategory] = useState('')
  const [selectedEventId, setSelectedEventId] = useState(routeEventId ? Number(routeEventId) : null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Fetch events list
  const { data: eventsData, isLoading: listLoading } = useEventList({
    type: activeCategory,
  })

  const events = useMemo(() => eventsData?.content || [], [eventsData])

  // If routeParam id is set or selectedEventId is set, fetch detail if needed
  const targetId = routeEventId ? Number(routeEventId) : selectedEventId
  const { data: detailData } = useEvent(targetId)

  const scrollToDetail = () => {
    setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Sync route ID with local selected state & scroll down to detail header
  useEffect(() => {
    if (routeEventId) {
      setSelectedEventId(Number(routeEventId))
      scrollToDetail()
    }
  }, [routeEventId])

  // Select first event if none selected or if selected is not in filtered list
  useEffect(() => {
    if (routeEventId) return
    if (events.length > 0) {
      if (!selectedEventId || !events.some((e) => e.id === selectedEventId)) {
        setSelectedEventId(events[0].id)
      }
    } else {
      setSelectedEventId(null)
    }
  }, [events, selectedEventId, routeEventId])

  const handleSelectEvent = (event) => {
    setSelectedEventId(event.id)
    navigate(`/events/${event.id}`, { replace: true })
    scrollToDetail()
  }

  const handleCreated = (newEvent) => {
    if (newEvent?.id) {
      setSelectedEventId(newEvent.id)
      navigate(`/events/${newEvent.id}`)
      scrollToDetail()
    }
  }

  const handleDeleted = (deletedId) => {
    const remaining = events.filter((e) => e.id !== deletedId)
    const nextSelected = remaining.length > 0 ? remaining[0].id : null
    setSelectedEventId(nextSelected)
    if (routeEventId && Number(routeEventId) === deletedId) {
      if (nextSelected) {
        navigate(`/events/${nextSelected}`, { replace: true })
      } else {
        navigate('/events', { replace: true })
      }
    }
  }

  // Find currently displayed event object
  const currentEvent = detailData || events.find((e) => e.id === selectedEventId)

  return (
    <>
      <Topbar onAction={() => setCreateModalOpen(true)} actionLabel="+ Host Event" />

      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Events &amp; Timelines</h1>
            <p className={styles.subtitle}>
              Discover hackathons, campus fests, contests &amp; placement schedules.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className={styles.pillsRow}>
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`${styles.pill} ${activeCategory === cat.value ? styles.activePill : ''}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Horizontal Event Strip */}
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Featured Timeline Events</h3>
          <span className={`${styles.badgeCount} mono`}>
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {listLoading && eventsData === undefined ? (
          <div className={styles.loadingStrip}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
        ) : (
          <EventStrip
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {/* Selected Event Detail Panel */}
        <div className={styles.detailSection}>
          <div className={styles.sectionHeader} ref={detailSectionRef}>
            <h3 className={styles.sectionTitle}>Event Breakdown &amp; Timeline</h3>
          </div>

          <EventDetailPanel event={currentEvent} onDelete={handleDeleted} />
        </div>
      </div>

      {/* Host Event Modal */}
      <CreateEventModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  )
}
