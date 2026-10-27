/**
 * Degree configuration and academic structure helper.
 * Supports degrees of varying durations (e.g. MBA: 2 yrs, B.Tech: 4 yrs, LLB: 5 yrs or 3 yrs, etc.)
 */

export const DEGREE_OPTIONS = [
  { value: 'B.Tech', label: 'B.Tech (Bachelor of Technology)', years: 4 },
  { value: 'B.E.', label: 'B.E. (Bachelor of Engineering)', years: 4 },
  { value: 'BCA', label: 'BCA (Bachelor of Computer Applications)', years: 3 },
  { value: 'BBA', label: 'BBA (Bachelor of Business Administration)', years: 3 },
  { value: 'B.Sc', label: 'B.Sc (Bachelor of Science)', years: 3 },
  { value: 'B.Com', label: 'B.Com (Bachelor of Commerce)', years: 3 },
  { value: 'B.A', label: 'B.A (Bachelor of Arts)', years: 3 },
  { value: 'MBA', label: 'MBA (Master of Business Administration)', years: 2 },
  { value: 'MCA', label: 'MCA (Master of Computer Applications)', years: 2 },
  { value: 'M.Tech', label: 'M.Tech (Master of Technology)', years: 2 },
  { value: 'M.Sc', label: 'M.Sc (Master of Science)', years: 2 },
  { value: 'LLB', label: 'LLB (Bachelor of Laws - 5 Years)', years: 5 },
  { value: 'LLB (3-Yr)', label: 'LLB (Bachelor of Laws - 3 Years)', years: 3 },
  { value: 'B.Arch', label: 'B.Arch (Architecture - 5 Years)', years: 5 },
  { value: 'MBBS', label: 'MBBS (Medicine - 5 Years)', years: 5 },
  { value: 'Other', label: 'Other Degree', years: 4 },
]

/**
 * Returns duration in years for a given degree name.
 * Defaults to 4 if not recognized.
 */
export function getDegreeDuration(degreeName) {
  if (!degreeName) return 4
  const clean = degreeName.trim().toLowerCase()
  if (clean.includes('mba') || clean.includes('m.tech') || clean.includes('mca') || clean.includes('m.sc') || clean.includes('m.com') || clean.includes('m.a')) {
    return 2
  }
  if (clean.includes('3') && clean.includes('llb')) {
    return 3
  }
  if (clean.includes('llb') || clean.includes('law') || clean.includes('arch') || clean.includes('mbbs') || clean.includes('medicine')) {
    return 5
  }
  if (clean.includes('bca') || clean.includes('bba') || clean.includes('b.sc') || clean.includes('b.com') || clean.includes('b.a') || clean.includes('bsc') || clean.includes('bcom')) {
    return 3
  }
  return 4
}

/**
 * Returns dynamic year tabs for a given degree name.
 * e.g. for MBA -> [ { value: 1, label: '1st Year', subtitle: 'Sem 1 & 2' }, { value: 2, label: '2nd Year', subtitle: 'Sem 3 & 4' } ]
 */
export function getYearOptionsForDegree(degreeName) {
  const duration = getDegreeDuration(degreeName)
  const options = []
  for (let y = 1; y <= duration; y++) {
    const semStart = (y * 2) - 1
    const semEnd = y * 2
    const suffix = y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'
    options.push({
      value: y,
      label: `${y}${suffix} Year`,
      subtitle: `Sem ${semStart} & ${semEnd}`,
    })
  }
  return options
}

/**
 * Returns dynamic semesters for a given degree and optional year filter.
 */
export function getSemestersForDegree(degreeName, year) {
  const duration = getDegreeDuration(degreeName)
  const totalSemesters = duration * 2
  const semesters = []

  const minSem = year ? (year * 2) - 1 : 1
  const maxSem = year ? Math.min(year * 2, totalSemesters) : totalSemesters

  for (let s = minSem; s <= maxSem; s++) {
    const yr = Math.ceil(s / 2)
    const suffix = yr === 1 ? 'st' : yr === 2 ? 'nd' : yr === 3 ? 'rd' : 'th'
    semesters.push({
      value: s,
      label: `Semester ${s}`,
      year: yr,
      yearLabel: `${yr}${suffix} Year`,
    })
  }
  return semesters
}
