/** Caché cliente con `localStorage` + fallback en memoria (H5). */

export const CACHE_TTL_MS = 3600_000

export type CacheEnvelope<T> = {
  data: T
  ts: number
}

const memoryFallback = new Map<string, string>()

function getBackend(): Storage | null {
  try {
    if (typeof window === 'undefined') {
      return null
    }
    if (typeof window.localStorage === 'undefined') {
      return null
    }
    return window.localStorage
  } catch {
    return null
  }
}

function readRaw(key: string): string | null {
  const backend = getBackend()
  if (backend === null) {
    return memoryFallback.get(key) ?? null
  }
  try {
    const raw = backend.getItem(key)
    if (raw !== null) {
      return raw
    }
    // Sin valor en localStorage: puede estar en el fallback (cuota previa).
    return memoryFallback.get(key) ?? null
  } catch {
    return memoryFallback.get(key) ?? null
  }
}

function isValidEnvelope<T>(parsed: unknown): parsed is CacheEnvelope<T> {
  if (typeof parsed !== 'object' || parsed === null) {
    return false
  }
  const candidate = parsed as Record<string, unknown>
  if (!('data' in candidate) || !('ts' in candidate)) {
    return false
  }
  const ts = (candidate as { ts: unknown }).ts
  return typeof ts === 'number' && Number.isFinite(ts)
}

export function read<T>(key: string): CacheEnvelope<T> | null {
  const raw = readRaw(key)
  if (raw === null || raw === '') {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isValidEnvelope<T>(parsed)) {
      return null
    }
    return { data: parsed.data, ts: parsed.ts }
  } catch {
    return null
  }
}

export function write(key: string, data: unknown): void {
  const envelope: CacheEnvelope<unknown> = { data, ts: Date.now() }
  let raw: string
  try {
    raw = JSON.stringify(envelope)
  } catch {
    return
  }
  const backend = getBackend()
  if (backend === null) {
    try {
      memoryFallback.set(key, raw)
    } catch {
      // Sin almacenamiento disponible: se ignora.
    }
    return
  }
  try {
    backend.setItem(key, raw)
    memoryFallback.delete(key)
  } catch {
    // Cuota llena o escritura bloqueada: fallback en memoria.
    try {
      memoryFallback.set(key, raw)
    } catch {
      // Sin memoria disponible: se ignora.
    }
  }
}

export function remove(key: string): void {
  memoryFallback.delete(key)
  const backend = getBackend()
  if (backend === null) {
    return
  }
  try {
    backend.removeItem(key)
  } catch {
    // Se ignora: el fallback en memoria ya se limpió.
  }
}

/** Limpia el fallback en memoria (solo tests). */
export function clearMemoryForTests(): void {
  memoryFallback.clear()
}

export const safeStorage = {
  read,
  write,
  remove,
}

/** `true` cuando `ts` tiene 1h o más respecto a `now`. */
export function isStale(ts: number, now: number = Date.now()): boolean {
  if (!Number.isFinite(ts) || !Number.isFinite(now)) {
    return true
  }
  return now - ts >= CACHE_TTL_MS
}
