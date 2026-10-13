import type { ProductDetail, ProductListItem } from './types'

export const DEFAULT_API_BASE_URL = 'https://itx-frontend-test.onrender.com'

const PRODUCT_LIST_PATH = '/api/product'

const CART_PATH = '/api/cart'

export const PRODUCT_ID_PATTERN = /^[A-Za-z0-9-_]+$/

/** Entrada del POST de cesta (contrato `POST /api/cart`). */
export type AddToCartInput = {
  id: string
  colorCode: number
  storageCode: number
}

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

/**
 * Obtiene el detalle de un producto (H3).
 * Valida el id, codifica con `encodeURIComponent` y distingue el 404.
 */
export async function getProduct(id: string, signal?: AbortSignal): Promise<ProductDetail> {
  if (!PRODUCT_ID_PATTERN.test(id)) {
    throw new Error('Id de producto no válido')
  }
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${PRODUCT_LIST_PATH}/${encodeURIComponent(id)}`

  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new Error(`No se pudo cargar el producto: sin conexión con ${baseUrl}.`)
  }

  if (response.status === 404) {
    throw new Error('Producto no encontrado')
  }

  if (!response.ok) {
    throw new Error(`No se pudo cargar el producto (HTTP ${response.status} de ${url}).`)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`No se pudo cargar el producto: respuesta no válida (HTTP ${response.status}).`)
  }

  if (typeof payload !== 'object' || payload === null) {
    throw new Error(`No se pudo cargar el producto: formato inesperado (HTTP ${response.status}).`)
  }

  const detail = payload as Record<string, unknown>
  const hasText = (value: unknown): boolean => typeof value === 'string' && value.trim() !== ''
  if (!hasText(detail.id) || !hasText(detail.brand) || !hasText(detail.model)) {
    throw new Error(`No se pudo cargar el producto: formato inesperado (HTTP ${response.status}).`)
  }

  return payload as ProductDetail
}

/**
 * Añade un producto a la cesta (H4).
 * Valida `id` (`PRODUCT_ID_PATTERN`) y que `colorCode`/`storageCode` sean
 * enteros ≥ 0 antes de enviar el POST. Devuelve el `count` de la respuesta.
 */
export async function addToCart(input: AddToCartInput): Promise<number> {
  if (!PRODUCT_ID_PATTERN.test(input.id)) {
    throw new Error('Id de producto no válido')
  }
  if (!Number.isInteger(input.colorCode) || input.colorCode < 0) {
    throw new Error('Código de color no válido: debe ser un entero mayor o igual que 0.')
  }
  if (!Number.isInteger(input.storageCode) || input.storageCode < 0) {
    throw new Error('Código de almacenamiento no válido: debe ser un entero mayor o igual que 0.')
  }

  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${CART_PATH}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: input.id,
        colorCode: input.colorCode,
        storageCode: input.storageCode,
      }),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new Error(`No se pudo añadir el producto a la cesta: sin conexión con ${baseUrl}.`)
  }

  if (!response.ok) {
    throw new Error(`No se pudo añadir el producto a la cesta (HTTP ${response.status} de ${url}).`)
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`No se pudo añadir el producto a la cesta: respuesta no válida (HTTP ${response.status}).`)
  }

  const count =
    typeof payload === 'object' && payload !== null && 'count' in payload
      ? (payload as { count: unknown }).count
      : undefined
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    throw new Error(`No se pudo añadir el producto a la cesta: formato inesperado (HTTP ${response.status}).`)
  }

  return count
}
