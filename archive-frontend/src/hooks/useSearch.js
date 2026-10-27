import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchService } from '../services/searchService'

export function useSearch(query, scope = 'all') {
  return useQuery({
    queryKey: ['search', query, scope],
    queryFn: () => searchService.search({ q: query, scope }),
    enabled: Boolean(query && query.trim().length > 0),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  })
}
