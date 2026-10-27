import { useEffect, useRef } from 'react'

/**
 * useInfiniteScroll — calls onLoadMore when the sentinel element enters the viewport.
 *
 * @param {Function} onLoadMore   Called when the sentinel is visible and hasMore is true
 * @param {boolean}  hasMore      Whether more data can be fetched
 * @param {boolean}  isFetching   Prevents duplicate calls while already fetching
 * @returns {React.RefObject}     Attach this ref to the sentinel div at the bottom of the list
 */
export function useInfiniteScroll(onLoadMore, hasMore, isFetching) {
  const sentinelRef = useRef(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          onLoadMore()
        }
      },
      { rootMargin: '200px' }, // trigger 200px before visible
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore, isFetching])

  return sentinelRef
}
