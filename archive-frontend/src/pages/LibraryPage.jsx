import { useState, useCallback, useEffect, useMemo } from 'react'
import Topbar from '../components/layout/Topbar.jsx'
import FilterBar from '../components/library/FilterBar.jsx'
import ResourceGrid from '../components/library/ResourceGrid.jsx'
import UploadModal from '../components/library/UploadModal.jsx'
import CreateSubjectModal from '../components/library/CreateSubjectModal.jsx'
import { useResourceList, useSubjects } from '../hooks/useResources.js'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll.js'
import useAuthStore from '../store/authStore.js'
import { getDegreeDuration, getYearOptionsForDegree } from '../utils/degreeConfig.js'
import styles from './LibraryPage.module.css'

export default function LibraryPage() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false)

  const currentUser = useAuthStore((state) => state.user)
  const degreeDuration = getDegreeDuration(currentUser?.degree || 'B.Tech')
  const baseYearOptions = useMemo(() => getYearOptionsForDegree(currentUser?.degree || 'B.Tech'), [currentUser?.degree])

  const initialYear = currentUser?.year && currentUser.year <= degreeDuration ? currentUser.year : 1

  const [filters, setFilters] = useState({
    type: '',
    subject: '',
    sort: 'latest',
    degree: currentUser?.degree || 'B.Tech',
    department: currentUser?.department || '',
    year: initialYear,
    semester: '',
  })

  // Sync degree, department, and year whenever currentUser profile updates
  useEffect(() => {
    if (currentUser) {
      const duration = getDegreeDuration(currentUser.degree || 'B.Tech')
      const targetYear = currentUser.year ? Math.min(currentUser.year, duration) : 1
      setFilters((prev) => {
        const keepYear = (prev.year && prev.year <= duration) ? prev.year : targetYear
        return {
          ...prev,
          degree: currentUser.degree || 'B.Tech',
          department: currentUser.department || '',
          year: keepYear,
          semester: '',
        }
      })
    }
  }, [currentUser?.degree, currentUser?.department, currentUser?.year])

  const { data: subjects = [] } = useSubjects({
    department: currentUser?.department,
    semester: filters.semester || (filters.year ? filters.year * 2 : undefined),
  })

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useResourceList(filters)

  // Flatten pages → flat resource array
  const resources = data?.pages?.flatMap((page) => page.content) ?? []

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(
    useCallback(() => { if (hasNextPage) fetchNextPage() }, [hasNextPage, fetchNextPage]),
    hasNextPage,
    isFetchingNextPage,
  )

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleYearChange = (yearVal) => {
    setFilters((prev) => ({
      ...prev,
      year: yearVal,
      semester: '',
      subject: '',
    }))
  }

  const handleOpenCreateSubject = () => {
    setCreateSubjectOpen(true)
  }

  const handleSubjectCreated = () => {
    setCreateSubjectOpen(false)
  }

  const handleOpenUpload = () => {
    setUploadOpen(true)
  }

  const isAdminOrMod = currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR'
  const yearTabs = isAdminOrMod
    ? [{ value: '', label: 'All Years', subtitle: 'All Semesters' }, ...baseYearOptions]
    : baseYearOptions

  return (
    <>
      <Topbar onAction={handleOpenUpload} />

      <div className={styles.page}>
        {/* Page header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Library</h1>
            <p className={styles.subtitle}>Browse and share academic resources</p>
          </div>
        </div>

        {/* Year Section Navigation Bar */}
        <div className={styles.yearNavContainer}>
          <div className={styles.yearTabsRow} role="tablist" aria-label="Academic Year">
            {yearTabs.map((yr) => {
              const isActive = String(filters.year) === String(yr.value)
              return (
                <button
                  key={yr.value || 'all-years'}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.yearTab} ${isActive ? styles.yearTabActive : ''}`}
                  onClick={() => handleYearChange(yr.value)}
                >
                  <span className={styles.yearLabel}>{yr.label}</span>
                  <span className={styles.yearSub}>{yr.subtitle}</span>
                </button>
              )
            })}
          </div>

          <div className={styles.deptBadge} title="Resources are scoped to your degree and department">
            <span className={styles.deptIcon}>🎓</span>
            <span>{currentUser?.degree || 'B.Tech'} • {currentUser?.department || 'General'}</span>
            {filters.year ? (
              <span className={styles.yearPill}>Year {filters.year} Section</span>
            ) : null}
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar
          filters={filters}
          subjects={subjects}
          onChange={handleFilterChange}
          onCreateSubject={handleOpenCreateSubject}
        />

        {/* Results count */}
        {!isLoading && (
          <p className={styles.count}>
            {resources.length > 0
              ? `${resources.length}${hasNextPage ? '+' : ''} resources`
              : null}
          </p>
        )}

        {/* Resource grid */}
        <ResourceGrid
          resources={resources}
          isLoading={isLoading && data === undefined}
          isError={isError}
          onRetry={refetch}
          sentinelRef={sentinelRef}
        />
      </div>

      {/* Create Subject Modal */}
      <CreateSubjectModal
        open={createSubjectOpen}
        onClose={() => setCreateSubjectOpen(false)}
        onCreate={handleSubjectCreated}
      />

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </>
  )
}

