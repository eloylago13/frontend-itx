import { useCallback, useEffect, useRef, useState } from 'react'
import { CACHE_TTL_MS, safeStorage } from './storage'

export type CachedStatus = 'loading' | 'ready' | 'error'

export type UseCachedResourceResult<T> = {
  data: T | null
  status: CachedStatus
  error: string
  reload: () => void
}

type UseCachedResourceOptions = {
  ttl?: number
  ttlMs?: number
}

export function useCachedResource<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options?: UseCachedResourceOptions,
): UseCachedResourceResult<T> {
  const ttl = options?.ttl ?? options?.ttlMs ?? CACHE_TTL_MS
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<CachedStatus>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const forceRef = useRef(false)

  const reload = useCallback(() => {
    forceRef.current = true
    setAttempt((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const forced = forceRef.current
    forceRef.current = false

    if (!forced) {
      const cached = safeStorage.read<T>(key)
      if (cached !== null && Number.isFinite(cached.ts)) {
        const age = Date.now() - cached.ts
        if (age < ttl) {
          setData(cached.data)
          setStatus('ready')
          setError('')
          return () => {
            cancelled = true
            controller.abort()
          }
        }
      }
    }

    setStatus('loading')
    setError('')
    if (!forced) {
      // Al cambiar de clave no se arrastra el dato anterior.
      setData(null)
    }

    void (async () => {
      try {
        const fresh = await fetcherRef.current(controller.signal)
        if (cancelled || controller.signal.aborted) {
          return
        }
        // Solo se cachea el éxito con datos válidos (el 404 va por error y no se guarda).
        if (fresh !== null && fresh !== undefined) {
          safeStorage.write(key, fresh)
        }
        setData(fresh ?? null)
        setStatus('ready')
        setError('')
      } catch (fetchError) {
        if (cancelled || controller.signal.aborted) {
          return
        }
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return
        }
        setError(fetchError instanceof Error ? fetchError.message : 'No se pudo cargar.')
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [key, attempt, ttl])

  return { data, status, error, reload }
}
