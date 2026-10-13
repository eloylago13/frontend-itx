import type { ProductListItem } from './types'

export const DEFAULT_API_BASE_URL = 'https://itx-frontend-test.onrender.com'

const PRODUCT_LIST_PATH = '/api/product'

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

/**
 * Resuelve la URL base del API.
 * - `undefined` (sin variable) → default de onrender.
 * - Vacía o solo espacios → error (se rechaza).
 * - Debe empezar por `http://` o `https://` (allowlist simple).
 */
export function resolveApiBaseUrl(raw?: string): string {
  if (raw === undefined) {
    return DEFAULT_API_BASE_URL
  }
  const trimmed = raw.trim()
  if (trimmed === '') {
    throw new Error('VITE_API_BASE_URL está vacía: define una URL http(s) válida o elimina la variable.')
  }
  if (!isHttpUrl(trimmed)) {
    throw new Error(
      `VITE_API_BASE_URL no permitida ("${trimmed}"): solo se admiten URLs que empiecen por http:// o https://.`,
    )
  }
  return trimmed.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined)
}

function toCleanString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isValidListItem(value: unknown): value is ProductListItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim() !== '' &&
    typeof candidate.brand === 'string' &&
    candidate.brand.trim() !== '' &&
    typeof candidate.model === 'string' &&
    candidate.model.trim() !== ''
  )
}

/**
 * Obtiene el listado de productos sin caché (H5 añadirá el cacheo).
 * Filtra los items sin `id`/`brand`/`model` y lanza errores con mensaje útil.
 */
export async function getProducts(signal?: AbortSignal): Promise<ProductListItem[]> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${PRODUCT_LIST_PATH}`

  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new Error(`No se pudieron cargar los productos: sin conexión con ${baseUrl}.`)
  }

  if (!response.ok) {
    throw new Error(`No se pudieron cargar los productos (HTTP ${response.status} de ${url}).`)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`No se pudieron cargar los productos: respuesta no válida (HTTP ${response.status}).`)
  }

  if (!Array.isArray(payload)) {
    throw new Error(`No se pudieron cargar los productos: formato inesperado (HTTP ${response.status}).`)
  }

  return payload.filter(isValidListItem).map((item) => ({
    id: item.id,
    brand: item.brand,
    model: item.model,
    price: toCleanString(item.price),
    imgUrl: toCleanString(item.imgUrl),
  }))
}
