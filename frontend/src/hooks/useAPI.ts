import { useState, useCallback } from 'react'
import type { APIError } from '@/lib/api-client'

interface UseAPIOptions {
  onSuccess?: (data: any) => void
  onError?: (error: APIError) => void
}

interface UseAPIReturn<T> {
  data: T | null
  loading: boolean
  error: APIError | null
  execute: (...args: any[]) => Promise<T | void>
  reset: () => void
}

/**
 * Hook for handling API calls with loading and error states
 *
 * @example
 * const { data, loading, error, execute } = useAPI(apiClient.getEvents)
 *
 * // In component
 * useEffect(() => {
 *   execute()
 * }, [])
 */
export function useAPI<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: UseAPIOptions
): UseAPIReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true)
        setError(null)

        const result = await apiFunction(...args)
        setData(result)

        if (options?.onSuccess) {
          options.onSuccess(result)
        }

        return result
      } catch (err) {
        const apiError = err as APIError
        setError(apiError)

        if (options?.onError) {
          options.onError(apiError)
        }
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, options]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
