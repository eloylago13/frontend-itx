import { afterEach, describe, expect, it, vi } from 'vitest'
import { addToCart, fetchWithTimeout, getProduct, getProducts, resolveApiBaseUrl } from './apiClient.ts'
import { navigate } from '../app/router.ts'

function mockFetchOk(payload: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    }),
  )
}

/** fetch que se queda colgado hasta que se aborta su signal. */
function mockFetchHang(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((_url: unknown, init?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason ?? new DOMException('Aborted', 'AbortError'))
        })
      })
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchWithTimeout', () => {
  it('lanza error de tiempo de espera si el servidor no responde', async () => {
    mockFetchHang()
    await expect(fetchWithTimeout('https://example.com/api/product', { timeoutMs: 50 })).rejects.toThrow(
      /Sin respuesta del servidor tras/,
    )
  })

  it('propaga el AbortError si quien llama aborta antes del timeout', async () => {
    mockFetchHang()
    const controller = new AbortController()
    const pending = fetchWithTimeout('https://example.com/api/product', {
      signal: controller.signal,
      timeoutMs: 5000,
    })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('resolveApiBaseUrl', () => {
  it('rechaza http no local y acepta https y localhost', () => {
    expect(() => resolveApiBaseUrl('http://evil.com')).toThrow(/no permitida/i)
    expect(resolveApiBaseUrl('https://example.com')).toBe('https://example.com')
    expect(resolveApiBaseUrl('http://localhost:5173')).toBe('http://localhost:5173')
    expect(() => resolveApiBaseUrl('  ')).toThrow(/vacía/i)
  })
})

describe('navigate', () => {
  it('ignora rutas externas y protocol-relative', () => {
    window.history.pushState(null, '', '/')
    navigate('//evil.com')
    expect(window.location.pathname).toBe('/')
    navigate('https://evil.com/x')
    expect(window.location.pathname).toBe('/')
    navigate('/product/demo-1')
    expect(window.location.pathname).toBe('/product/demo-1')
    window.history.pushState(null, '', '/')
  })
})

describe('getProducts', () => {
  it('filtra items sin id/brand/model', async () => {
    mockFetchOk([
      { id: 'a', brand: 'B', model: 'M', price: '1', imgUrl: '' },
      { id: '', brand: 'B', model: 'M' },
      { nope: true },
    ])
    const products = await getProducts()
    expect(products).toEqual([{ id: 'a', brand: 'B', model: 'M', price: '1', imgUrl: '' }])
  })
})

describe('getProduct', () => {
  it('rechaza ids con formato no válido sin llamar a fetch', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)
    await expect(getProduct('a/b')).rejects.toThrow(/no válido/i)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('addToCart', () => {
  it('envía el payload exacto y devuelve el count', async () => {
    const spy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ count: 3 }),
    })
    vi.stubGlobal('fetch', spy)
    await expect(addToCart({ id: 'demo-1', colorCode: 1000, storageCode: 2000 })).resolves.toBe(3)
    expect(spy).toHaveBeenCalledOnce()
    const [, init] = spy.mock.calls[0] as [string, { body: string }]
    expect(JSON.parse(init.body)).toEqual({ id: 'demo-1', colorCode: 1000, storageCode: 2000 })
  })

  it('rechaza códigos no enteros sin llamar a fetch', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)
    await expect(addToCart({ id: 'demo-1', colorCode: 1.5, storageCode: 2000 })).rejects.toThrow(
      /no válido/i,
    )
    expect(spy).not.toHaveBeenCalled()
  })
})
