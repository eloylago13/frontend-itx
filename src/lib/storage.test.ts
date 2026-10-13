import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_TTL_MS, clearMemoryForTests, isStale, safeStorage } from './storage'

beforeEach(() => {
  window.localStorage.clear()
  clearMemoryForTests()
  vi.useRealTimers()
})

afterEach(() => {
  window.localStorage.clear()
  clearMemoryForTests()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('storage: safeStorage', () => {
  it('write + read devuelven el envelope {data, ts}', () => {
    safeStorage.write('k1', { hello: 'world' })
    const entry = safeStorage.read<{ hello: string }>('k1')
    expect(entry).not.toBeNull()
    expect(entry?.data).toEqual({ hello: 'world' })
    expect(typeof entry?.ts).toBe('number')

    const raw = window.localStorage.getItem('k1')
    expect(raw).toContain('"data"')
    expect(raw).toContain('"ts"')
  })

  it('read devuelve null si el JSON está corrupto', () => {
    window.localStorage.setItem('k-corrupt', 'no-json{{{')
    expect(safeStorage.read('k-corrupt')).toBeNull()
  })

  it('read devuelve null si la forma no es {data, ts:number}', () => {
    window.localStorage.setItem('k-bad1', JSON.stringify({ count: 4, ts: 123 }))
    expect(safeStorage.read('k-bad1')).toBeNull()

    window.localStorage.setItem('k-bad2', JSON.stringify({ data: 1, ts: 'ayer' }))
    expect(safeStorage.read('k-bad2')).toBeNull()

    window.localStorage.setItem('k-bad3', JSON.stringify([1, 2, 3]))
    expect(safeStorage.read('k-bad3')).toBeNull()
  })

  it('remove borra el valor', () => {
    safeStorage.write('k-del', { a: 1 })
    expect(safeStorage.read('k-del')).not.toBeNull()
    safeStorage.remove('k-del')
    expect(safeStorage.read('k-del')).toBeNull()
    expect(window.localStorage.getItem('k-del')).toBeNull()
  })

  it('fallback a memoria si la escritura en localStorage lanza (cuota)', () => {
    const setSpy = vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    try {
      safeStorage.write('k-quota', { n: 42 })
      // localStorage no guardó nada, pero el fallback en memoria responde.
      expect(window.localStorage.getItem('k-quota')).toBeNull()
      expect(safeStorage.read<{ n: number }>('k-quota')).toEqual(
        expect.objectContaining({ data: { n: 42 } }),
      )
    } finally {
      setSpy.mockRestore()
    }
  })

  it('fallback a memoria si localStorage no está disponible', () => {
    const backend = window.localStorage
    // Simula entorno sin localStorage.
    vi.stubGlobal('window', { ...window, localStorage: undefined })
    void backend
    try {
      safeStorage.write('k-nols', { v: 7 })
      expect(safeStorage.read<{ v: number }>('k-nols')?.data).toEqual({ v: 7 })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('storage: isStale + TTL', () => {
  it('CACHE_TTL_MS es 1 hora', () => {
    expect(CACHE_TTL_MS).toBe(3600_000)
  })

  it('fresco justo antes de 1h, stale justo después (fake timers)', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    safeStorage.write('k-ttl', { x: 1 })
    const entry = safeStorage.read<{ x: number }>('k-ttl')
    expect(entry).not.toBeNull()
    const ts = entry?.ts ?? now

    // Recién guardado: no stale.
    expect(isStale(ts, now)).toBe(false)
    // 59:59 min después: aún fresco.
    vi.setSystemTime(now + CACHE_TTL_MS - 1)
    expect(isStale(ts, Date.now())).toBe(false)
    // 1h después: stale.
    vi.setSystemTime(now + CACHE_TTL_MS)
    expect(isStale(ts, Date.now())).toBe(true)
    // Después de 1h: stale.
    vi.setSystemTime(now + CACHE_TTL_MS + 1)
    expect(isStale(ts, Date.now())).toBe(true)
  })

  it('isStale por defecto usa Date.now()', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    expect(isStale(now - CACHE_TTL_MS - 10)).toBe(true)
    expect(isStale(now - 1000)).toBe(false)
  })
})
