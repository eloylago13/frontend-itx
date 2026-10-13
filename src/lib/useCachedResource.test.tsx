import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CACHE_TTL_MS, safeStorage } from './storage'
import { useCachedResource } from './useCachedResource'

function Harness({
  cacheKey,
  fetcher,
  ttl,
}: {
  cacheKey: string
  fetcher: (signal: AbortSignal) => Promise<string>
  ttl?: number
}): JSX.Element {
  const { data, status, error, reload } = useCachedResource<string>(cacheKey, fetcher, { ttl })
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="data">{data ?? 'empty'}</p>
      <p data-testid="error">{error === '' ? 'no-error' : error}</p>
      <button type="button" onClick={reload}>
        reload
      </button>
    </div>
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useCachedResource', () => {
  it('hit fresco: no llama a fetch y muestra el dato cacheado', async () => {
    safeStorage.write('itx:test:fresh', 'cached!')
    const fetcher = vi.fn(async () => 'fresh-fetch')

    render(<Harness cacheKey="itx:test:fresh" fetcher={fetcher} />)

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready')
    })
    expect(screen.getByTestId('data')).toHaveTextContent('cached!')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('stale: refetch y actualiza la caché', async () => {
    vi.useFakeTimers()
    try {
      safeStorage.write('itx:test:stale', 'old')
      // Envejece el ts más allá del TTL.
      const raw = window.localStorage.getItem('itx:test:stale')
      expect(raw).not.toBeNull()
      const parsed = JSON.parse(raw as string) as { data: unknown; ts: number }
      const staleTs = Date.now() - CACHE_TTL_MS - 1000
      window.localStorage.setItem('itx:test:stale', JSON.stringify({ data: parsed.data, ts: staleTs }))
      vi.useRealTimers()

      const fetcher = vi.fn(async () => 'new-data')
      render(<Harness cacheKey="itx:test:stale" fetcher={fetcher} />)

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('ready')
      })
      expect(screen.getByTestId('data')).toHaveTextContent('new-data')
      expect(fetcher).toHaveBeenCalledTimes(1)
      expect(safeStorage.read<string>('itx:test:stale')?.data).toBe('new-data')
    } finally {
      vi.useRealTimers()
    }
  })

  it('ausente: fetch, write y ready', async () => {
    const fetcher = vi.fn(async () => 'fetched')
    render(<Harness cacheKey="itx:test:miss" fetcher={fetcher} />)

    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready')
    })
    expect(screen.getByTestId('data')).toHaveTextContent('fetched')
    expect(safeStorage.read<string>('itx:test:miss')?.data).toBe('fetched')
  })

  it('reload fuerza fetch aunque haya hit fresco', async () => {
    const user = userEvent.setup()
    safeStorage.write('itx:test:reload', 'cached')
    const fetcher = vi.fn(async () => 'reloaded')

    render(<Harness cacheKey="itx:test:reload" fetcher={fetcher} />)

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready')
    })
    expect(fetcher).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /reload/i }))

    await waitFor(() => {
      expect(fetcher).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('reloaded')
    })
  })

  it('error: status error con mensaje sin stack', async () => {
    const fetcher = vi.fn(async (): Promise<string> => {
      throw new Error('Fallo de red')
    })
    render(<Harness cacheKey="itx:test:error" fetcher={fetcher} />)

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
    })
    expect(screen.getByTestId('error')).toHaveTextContent('Fallo de red')
    expect(screen.getByTestId('error').textContent).not.toContain('at ')
    // El error no se cachea.
    expect(safeStorage.read<string>('itx:test:error')).toBeNull()
  })

  it('respeta el ttl personalizado', async () => {
    safeStorage.write('itx:test:custom-ttl', 'old')
    const raw = window.localStorage.getItem('itx:test:custom-ttl')
    const parsed = JSON.parse(raw as string) as { data: unknown; ts: number }
    // 2s de antigüedad.
    window.localStorage.setItem(
      'itx:test:custom-ttl',
      JSON.stringify({ data: parsed.data, ts: Date.now() - 2000 }),
    )

    // Con ttl de 1s → stale → refetch.
    const fetcherStale = vi.fn(async () => 'new')
    const { unmount } = render(<Harness cacheKey="itx:test:custom-ttl" fetcher={fetcherStale} ttl={1000} />)
    await waitFor(() => {
      expect(screen.getByTestId('data')).toHaveTextContent('new')
    })
    expect(fetcherStale).toHaveBeenCalledTimes(1)
    unmount()

    // Reescribe como fresco de 2s y con ttl de 1h → hit sin fetch.
    safeStorage.write('itx:test:custom-ttl2', 'kept')
    const fetcherFresh = vi.fn(async () => 'should-not-fetch')
    render(<Harness cacheKey="itx:test:custom-ttl2" fetcher={fetcherFresh} ttl={CACHE_TTL_MS} />)
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready')
    })
    expect(fetcherFresh).not.toHaveBeenCalled()
  })

  it('aborta el fetch al desmontar sin romper', async () => {
    let aborted = false
    const fetcher = vi.fn(
      (signal: AbortSignal) =>
        new Promise<string>((resolve, reject) => {
          void resolve
          signal.addEventListener('abort', () => {
            aborted = true
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    )
    const { unmount } = render(<Harness cacheKey="itx:test:abort" fetcher={fetcher} />)
    await act(async () => {
      await Promise.resolve()
    })
    unmount()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(aborted).toBe(true)
  })
})
